"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useRealFPS } from "./common/fpsCalculator";
import FallingWindow from "./play/fallingWindow";
import useGameLogic from "./play/gameLogic";
import { ChartBrief, ChartSeqData, CidSchema } from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { useColorThief } from "./common/colorThief";
import clsx from "clsx/lite";
import { ChartListItem } from "./main/chartList";
import { fetchBackend } from "./common/fetch";
import { fetchBrief } from "./common/briefCache";
import { useFlash } from "./common/targetLine";
import { useDisplayMode } from "./scale";
import { useSafariDetector } from "./common/pwaInstall";
import { IrasutoyaLikeGrass } from "./common/irasutoyaLike";
import { useRouter } from "next/navigation";
import { useSharePageModal } from "./common/sharePageModal";
import { ButtonHighlight } from "./common/button";
import * as v from "valibot";
import Link from "next/link";
import Search from "@icon-park/react/lib/icons/Search";
import { useTranslations } from "next-intl";

export interface DemoChart {
  cid: string;
  lvIndex: number;
  offset: number;
}
export const demoCharts: DemoChart[] = (
  process.env.NODE_ENV === "development" &&
  // 本番環境(ネットワーク越し)はTLDを含むはずという雑なチェック
  !/[a-z]\.[a-z]/.test(process.env.BACKEND_PREFIX ?? "")
    ? ([["102399", 0, 4.5]] as const)
    : ([
        ["850858", 1, 11.3], // bad apple!! single-7
        ["596134", 0, 8.1], // lagtrain single-3
        ["170465", 1, 0], // tetoris double-7
        ["592994", 0, 38.3], // phony single-4
        ["488006", 0, 15.4], // megalovania single-5
        ["142383", 0, 10.8], // night of nights single-6
        ["683932", 1, 10.5], // conflict double-9
        ["768743", 0, 46.4], // freedom dive single-8
      ] as const)
).map(([cid, lvIndex, offset]) => ({ cid, lvIndex, offset }));

export function TopSearchBox(props: { locale: string }) {
  const t = useTranslations("main");
  const { openModal, openShareInternal } = useSharePageModal();
  const { isMobileMain } = useDisplayMode();
  const [searchText, setSearchText] = useState<string>("");
  const router = useRouter();
  // cidの検索中にsearchTextが変わる可能性もある → 見つからなかったcidを入れ、searchText===cidNotFoundなら見つかりませんでしたを表示する
  const [cidNotFound, setCidNotFound] = useState<string | null>(null);
  const gotoCId = (cid: string) => {
    fetchBackend()
      .get(`/api/brief/${cid}`)
      .notFound(() => {
        setCidNotFound(cid);
      })
      .res(() => {
        if (isMobileMain) {
          openShareInternal(cid);
        } else {
          openModal(cid);
        }
      });
  };
  const searchParams = new URLSearchParams({ search: searchText });
  let searchHash = "";
  if (!isMobileMain) {
    // スマホでは検索欄にフォーカスしたらソフトキーボードで結果が隠れて邪魔なのでは。
    searchHash = "#search";
  }
  const searchURL =
    `/${props.locale}/main/play?` + searchParams.toString() + searchHash;

  return (
    <div className="flex flex-col items-center w-full gap-1">
      <div
        className={clsx(
          "fn-flat-button fn-selected fn-plain rounded-sq-2xl w-full max-w-120 main-wide:max-w-160",
          "has-focus:shadow-sm hover:shadow-sm shadow-slate-500/50 dark:shadow-stone-950/50"
        )}
      >
        <span className="fn-glass-1" />
        <span className="fn-glass-2" />
        <ButtonHighlight />
        <input
          className={clsx(
            "w-full font-title text-base min-[64rem]:text-xl p-3",
            "border-0 outline-0! bg-transparent appearance-none rounded-none"
          )}
          placeholder={t("play.searchPlaceholder")}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCidNotFound(null);
            if (v.safeParse(CidSchema(), e.target.value).success) {
              gotoCId(e.target.value);
            }
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              router.push(searchURL);
            }
          }}
        />
        <Link
          href={searchURL}
          className="absolute right-1.5 inset-y-0 my-auto fn-icon-button h-max"
          prefetch={process.env.PREFETCH as "auto"}
        >
          <Search className="text-lg min-[64rem]:text-2xl self-center" />
        </Link>
      </div>
      <span
        className={clsx(
          "text-red-500",
          cidNotFound !== searchText && "invisible"
        )}
      >
        {t("play.cidNotFound", { cid: cidNotFound ?? "" })}
      </span>
    </div>
  );
}
/**
 * コンテンツの背景にデモを表示し、
 * スクロール状態に応じてgrassを動かしたりデモを止めたりする
 */
export function WithTopDemo(props: { children: ReactNode }) {
  const { isMobileMain, isMobileGame, screenHeight, rem, statusScale } =
    useDisplayMode();
  // 画面幅が一定以下 or 画面が縦長 のときデモ画面をモバイルレイアウトにする
  const isMobileEither = isMobileMain || isMobileGame;
  const isSafari = useSafariDetector();
  const grassRefNear = useRef<HTMLDivElement | SVGSVGElement>(null);
  const grassRefFar = useRef<HTMLDivElement | SVGSVGElement>(null);
  const grassHeight =
    (isMobileEither
      ? Math.min(6 * statusScale * rem, 0.15 * screenHeight)
      : 0.1 * screenHeight) +
    1 * rem;
  const [initAnim, setInitAnim] = useState<boolean>(false);
  const [demoVisible, setDemoVisible] = useState<boolean>(false);
  const [demoChart, setDemoChart] = useState<DemoChart>();
  useEffect(() => {
    if (isSafari !== undefined) {
      setTimeout(
        () =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              setInitAnim(true);
              setDemoChart(
                demoCharts[Math.floor(demoCharts.length * Math.random())]
              );
            })
          ),
        100
      );
    }
  }, [isSafari]);
  useLayoutEffect(() => {
    if (isSafari !== undefined) {
      let req: ReturnType<typeof requestAnimationFrame> | null = null;
      const update = () => {
        for (const ref of [grassRefNear, grassRefFar]) {
          if (ref.current) {
            if (isSafari === true) {
              ref.current.scrollTop =
                0.3 * window.innerHeight - Math.max(0, window.scrollY / 2);
            } else {
              ref.current.style.bottom = `-${2.5 * rem + Math.max(0, window.scrollY / 2)}px`;
            }
          }
        }
        setDemoVisible(window.scrollY < window.innerHeight);
        req = null;
      };
      const onScroll = () => {
        if (req === null) {
          req = requestAnimationFrame(update);
        }
      };
      update();
      window.addEventListener("scroll", onScroll);
      return () => {
        window.removeEventListener("scroll", onScroll);
        if (req !== null) {
          cancelAnimationFrame(req);
        }
      };
    }
    // initAnimがtrueになる瞬間にも再実行する必要がある
  }, [isSafari, initAnim, rem]);

  const { openModal, openShareInternal } = useSharePageModal();

  return (
    <>
      {/*
      safariでは高さ80vhのdiv要素で囲い50vhのdiv要素の中でそれをスクロールすることで動かすのが一番滑らかに動く。
      しかしこのアプローチはchromeで重く、firefoxでsvgが描画されなくなるバグがある。
      chrome,firefoxではsvgのbottomの値を書き換えて動かす。これはsafariだと重くて動かない

      iOS26以降では上端にかかる100dvhにするとステータスバー・ツールバーの挙動が変わる
      */}
      {isSafari === true ? (
        <>
          <div
            ref={(node) => {
              grassRefFar.current = node;
            }}
            className="fixed inset-0 top-[50vh] overflow-hidden pointer-events-none z-irasutoya-like-grass-far"
          >
            <figure className="relative w-full h-[80vh]">
              <IrasutoyaLikeGrass
                only="far"
                className={clsx(
                  "absolute",
                  "transition-transform duration-500 ease-out",
                  initAnim ? "" : "translate-y-[30vh] opacity-0"
                )}
                height={grassHeight}
              />
            </figure>
          </div>
          <div
            ref={(node) => {
              grassRefNear.current = node;
            }}
            className="fixed inset-0 top-[50vh] overflow-hidden pointer-events-none z-irasutoya-like-grass-near"
          >
            <figure className="relative w-full h-[80vh]">
              <IrasutoyaLikeGrass
                only="near"
                className={clsx(
                  "absolute",
                  "transition-transform duration-500 ease-out",
                  initAnim ? "" : "translate-y-[30vh] opacity-0"
                )}
                height={grassHeight}
              />
            </figure>
          </div>
        </>
      ) : isSafari === false ? (
        <IrasutoyaLikeGrass
          refNear={(node) => {
            grassRefNear.current = node;
          }}
          refFar={(node) => {
            grassRefFar.current = node;
          }}
          className={clsx(
            "transition-transform duration-500 ease-out",
            initAnim ? "" : "translate-y-[30vh] opacity-0"
          )}
          height={grassHeight}
        />
      ) : null}

      <div
        id="top"
        className={clsx(
          "w-full h-max min-h-screen flex items-center justify-center",
          "flex-col demo-wide:flex-row-reverse demo-wide:items-stretch"
        )}
      >
        <div className="grow shrink-0 grid-centering px-sai-3 pt-sai demo-wide:py-sai demo-wide:pl-9 demo-wide:pr-sai-9">
          <DemoDetail
            {...demoChart}
            onClick={openModal}
            onClickMobile={openShareInternal}
          />
        </div>
        <div
          className={clsx(
            "relative w-full",
            "grow-2 basis-[max-content]",
            "demo-wide:grow-1 demo-wide:basis-main demo-wide:min-w-0",
            "demo-wide:flex demo-wide:items-center demo-wide:justify-end"
          )}
        >
          <section
            className={clsx(
              "w-full max-w-main",
              "flex flex-col items-center text-center",
              "justify-start px-sai-3 pt-6 pb-sai-6 gap-6",
              "demo-wide:justify-center demo-wide:pl-sai-12 demo-wide:pr-0 demo-wide:py-sai-6",
              "min-[64rem]:gap-8 min-[82rem]:gap-12"
            )}
          >
            {props.children}
          </section>
          <TopDemo {...demoChart} bottom={grassHeight} visible={demoVisible} />
        </div>
      </div>
    </>
  );
}

export function TopDemo(
  props: { visible: boolean; bottom: number } & Partial<DemoChart>
) {
  const { fps: realFps, hasStableValue: realFpsStable } = useRealFPS();
  const [runFps, setRunFps] = useState<number>(0);
  const [renderFps, setRenderFps] = useState<number>(0);
  const [showFps, setShowFps] = useState<boolean>(false);
  const [ignoreRunDelta, setIgnoreRunDelta] = useState<boolean>(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("fps")) {
      setShowFps(true);
    }
    if (params.has("ignoreRunDelta")) {
      setIgnoreRunDelta(true);
    }
  }, []);

  const { flashRef, flash } = useFlash();
  const currentTimeSec = useRef<number>(0);
  const prevTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  const getCurrentTimeSec = useCallback(() => {
    if (props.visible) {
      if (prevTimeStamp.current !== null) {
        currentTimeSec.current +=
          (performance.now() - prevTimeStamp.current) / 1000;
      }
    }
    prevTimeStamp.current = performance.now();
    return currentTimeSec.current;
  }, [props.visible]);
  const [notesAll, resetNotesAll /* , ... */] = useGameLogic(
    getCurrentTimeSec,
    true,
    false,
    0,
    false,
    null,
    1,
    null,
    flash
  );
  useEffect(() => {
    if (
      !notesAll.length &&
      props.cid &&
      props.lvIndex !== undefined &&
      props.offset !== undefined
    ) {
      fetchBackend()
        .get(`/api/seqFile/${props.cid}/${props.lvIndex}`)
        .arrayBuffer((buf) => {
          const seq = msgpack.decode(buf) as ChartSeqData;
          resetNotesAll(
            seq.notes.map((n) => ({
              ...n,
              done: 0,
              bigDone: false,
            })),
            props.offset! - seq.offset
          );
          currentTimeSec.current = props.offset! - seq.offset;
        });
    }
  }, [notesAll, resetNotesAll, props.cid, props.lvIndex, props.offset]);

  return (
    <>
      <FallingWindow
        blur
        className="absolute inset-0 isolate z-title-fw"
        style={{ bottom: props.bottom }}
        notes={notesAll}
        getCurrentTimeSec={getCurrentTimeSec}
        playing={true}
        setRunFPS={setRunFps}
        setRenderFPS={setRenderFps}
        noClear={false}
        playbackRate={1}
        shouldHideBPMSign={false}
        setShouldHideBPMSign={() => undefined}
        showTSOffset={false}
        ignoreRunDelta={ignoreRunDelta}
        flashRef={flashRef}
      />
      {showFps && (
        <span className="fixed left-3 bottom-3 isolate z-play-version">
          [{renderFps} / {runFps} / {Math.round(realFps)}
          {!realFpsStable && "?"} FPS]
        </span>
      )}
    </>
  );
}

export function DemoDetail(
  props: {
    onClick: (cid: string) => void;
    onClickMobile: (cid: string) => void;
  } & Partial<DemoChart>
) {
  const [brief, setBrief] = useState<ChartBrief>();
  useEffect(() => {
    if (!brief && props.cid) {
      fetchBrief(props.cid, {
        onResult: (brief) => setBrief(brief),
      });
    }
  }, [brief, props.cid]);

  const colorThief = useColorThief();

  const [show, setShow] = useState<boolean>(false);
  const initTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  useEffect(() => {
    if (props.cid && props.lvIndex !== undefined) {
      if (initTimeStamp.current === null) {
        initTimeStamp.current = performance.now();
      }
      if (brief) {
        setTimeout(
          () => setShow(true),
          Math.max(0, initTimeStamp.current + 500 - performance.now())
        );
      }
    }
  }, [props.cid, props.lvIndex, brief]);

  return (
    <>
      <ul
        className={clsx(
          "hidden demo-wide:grid",
          "fn-chart-list fn-cl-big-v w-(--item-max-width)",
          "transition-[translate,opacity] duration-1000 ease-out",
          show ? "" : "opacity-0 translate-y-1"
        )}
      >
        <ChartListItem
          className={colorThief.boxStyle}
          style={{ color: colorThief.currentColor }}
          cid={props.cid ?? ""}
          brief={brief}
          href={`/share/${props.cid}`}
          onClick={() => props.onClick(props.cid!)}
          onClickMobile={() => props.onClickMobile(props.cid!)}
          badge
          big="v"
          noDefaultColor
        />
      </ul>
      <ul
        className={clsx(
          "demo-wide:hidden",
          "fn-chart-list fn-cl-big-h w-(--item-max-width) max-w-full",
          "transition-[translate,opacity] duration-1000 ease-out",
          show ? "" : "opacity-0 translate-y-1"
        )}
      >
        <ChartListItem
          className={colorThief.boxStyle}
          style={{ color: colorThief.currentColor }}
          cid={props.cid ?? ""}
          brief={brief}
          href={`/share/${props.cid}`}
          onClick={() => props.onClick(props.cid!)}
          onClickMobile={() => props.onClickMobile(props.cid!)}
          badge
          big="h"
          noDefaultColor
        />
      </ul>
      {brief?.ytId && (
        <img
          ref={colorThief.imgRef}
          className="hidden"
          src={`https://i.ytimg.com/vi/${brief?.ytId}/mqdefault.jpg`}
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}
