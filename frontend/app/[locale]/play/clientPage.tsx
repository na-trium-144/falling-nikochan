/*
クエリパラメーター

* sid=セッションID または cid=譜面ID&lvIndex=インデックス で譜面を指定
* fps=1 でFPS表示
* speed=1 で音符の速度変化を表示
* result=1 でリザルト表示
* auto=1 でオートプレイをデフォルトにする

*/

"use client";

const exampleResult = {
  baseScore100: 777,
  chainScore100: 2000,
  bigScore100: 123,
  score100: 2900,
  judgeCount: [11, 22, 33, 44],
  bigCount: 55,
} as const;

import { useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow.js";
import { ChartSeqData6, levelTypes, loadChart6 } from "@falling-nikochan/chart";
import { ChartSeqData8, loadChart8 } from "@falling-nikochan/chart";
import { YouTubePlayer } from "@/common/youtube.js";
import { ChainDisp, ScoreDisp } from "./score.js";
import RhythmicalSlime from "./rhythmicalSlime.js";
import useGameLogic from "./gameLogic.js";
import { InitErrorMessage, ReadyMessage, StopMessage } from "./messageBox.js";
import StatusBox from "./statusBox.js";
import { useResizeDetector } from "react-resize-detector";
import { ChartBrief } from "@falling-nikochan/chart";
import msgpack from "@ygoe/msgpack";
import { CenterBox } from "@/common/box.js";
import { useDisplayMode } from "@/scale.js";
import { addRecent } from "@/common/recent.js";
import Result, { resultAnimDelays } from "./result.js";
import { getBestScore, setBestScore } from "@/common/bestScore.js";
import BPMSign from "./bpmSign.js";
import { getSession } from "./session.js";
import { MusicArea } from "./musicArea.js";
import { useTheme } from "@/common/theme.js";
import { fetchBrief } from "@/common/briefCache.js";
import { Level6Play } from "@falling-nikochan/chart";
import { Level8Play } from "@falling-nikochan/chart";
import { LoadingSlime } from "@/common/loadingSlime.js";
import { useTranslations } from "next-intl";

export function InitPlay({ locale }: { locale: string }) {
  const te = useTranslations("error");

  const [showFps, setShowFps] = useState<boolean>(false);
  const [displaySpeed, setDisplaySpeed] = useState<boolean>(false);
  const [goResult, setGoResult] = useState<boolean>(false);
  const [autoDefault, setAutoDefault] = useState<boolean>(false);

  const [cid, setCid] = useState<string>();
  const [lvIndex, setLvIndex] = useState<number>();
  const [chartBrief, setChartBrief] = useState<ChartBrief>();
  const [chartSeq, setChartSeq] = useState<ChartSeqData6 | ChartSeqData8>();
  const [editing, setEditing] = useState<boolean>(false);

  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMsg, setErrorMsg] = useState<string>();
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sid = Number(searchParams.get("sid"));
    const cidFromParam = searchParams.get("cid");
    const lvIndexFromParam = Number(searchParams.get("lvIndex"));
    setShowFps(searchParams.get("fps") !== null);
    setDisplaySpeed(searchParams.get("speed") !== null);
    setGoResult(searchParams.get("result") !== null);
    setAutoDefault(searchParams.get("auto") !== null);

    const session = getSession(sid);
    // history.replaceState(null, "", location.pathname);
    if (session !== null) {
      setCid(session.cid);
      setLvIndex(session.lvIndex);
      setChartBrief(session.brief);
      setEditing(!!session.editing);
    } else {
      if (cidFromParam) {
        setCid(cidFromParam);
        setLvIndex(lvIndexFromParam);
        void (async () =>
          setChartBrief((await fetchBrief(cidFromParam)).brief))();
        setEditing(false);
      } else {
        setErrorMsg(te("noSession"));
        return;
      }
    }
    // document.title =
    //   (session.editing ? "(テストプレイ) " : "") +
    //   pageTitle(session.cid || "-", session.brief) +
    //   " | Falling Nikochan";

    if (session?.level) {
      setChartSeq(loadChart8(session.level));
      setErrorStatus(undefined);
      setErrorMsg(undefined);
    } else {
      void (async () => {
        const res = await fetch(
          process.env.BACKEND_PREFIX +
            `/api/playFile/${session?.cid || cidFromParam}` +
            `/${session?.lvIndex || lvIndexFromParam}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          try {
            const seq: Level6Play | Level8Play = msgpack.deserialize(
              await res.arrayBuffer()
            );
            if (seq.ver === 6 || seq.ver === 8) {
              switch (seq.ver) {
                case 6:
                  setChartSeq(loadChart6(seq));
                  break;
                case 8:
                  setChartSeq(loadChart8(seq));
                  break;
              }
              setErrorStatus(undefined);
              setErrorMsg(undefined);
              addRecent("play", session?.cid || cidFromParam || "");
            } else {
              setChartSeq(undefined);
              setErrorStatus(undefined);
              setErrorMsg(te("chartVersion", { ver: (seq as any)?.ver }));
            }
          } catch (e) {
            setChartSeq(undefined);
            setErrorStatus(undefined);
            console.error(e);
            setErrorMsg(te("badResponse"));
          }
        } else {
          setChartSeq(undefined);
          setErrorStatus(res.status);
          try {
            const message = ((await res.json()) as { message?: string })
              .message;
            if (te.has("api." + message)) {
              setErrorMsg(te("api." + message));
            } else {
              setErrorMsg(message || te("unknownApiError"));
            }
          } catch {
            setErrorMsg(te("unknownApiError"));
          }
        }
      })();
    }
  }, [te]);

  return (
    <Play
      apiErrorMsg={
        errorStatus && errorMsg ? `${errorStatus}: ${errorMsg}` : errorMsg
      }
      cid={cid}
      lvIndex={lvIndex || 0}
      chartBrief={chartBrief}
      chartSeq={chartSeq}
      editing={editing}
      showFps={showFps}
      displaySpeed={displaySpeed}
      goResult={goResult}
      autoDefault={autoDefault}
      locale={locale}
    />
  );
}

interface Props {
  apiErrorMsg?: string;
  cid?: string;
  lvIndex: number;
  chartBrief?: ChartBrief;
  chartSeq?: ChartSeqData6 | ChartSeqData8;
  editing: boolean;
  showFps: boolean;
  displaySpeed: boolean;
  goResult: boolean;
  autoDefault: boolean;
  locale: string;
}
function Play(props: Props) {
  const {
    apiErrorMsg,
    cid,
    lvIndex,
    chartBrief,
    chartSeq,
    editing,
    showFps,
    displaySpeed,
  } = props;
  const te = useTranslations("error");

  const [initAnim, setInitAnim] = useState<boolean>(false);
  useEffect(() => {
    setTimeout(() => setInitAnim(true));
  }, []);

  const lvType: string =
    (lvIndex !== undefined && chartBrief?.levels[lvIndex]?.type) || "";
  const musicAreaOk = initAnim && levelTypes.includes(lvType);
  const [cloudsOk, setCloudsOk] = useState<boolean>(false);
  useEffect(() => {
    if (musicAreaOk) {
      setTimeout(() => setCloudsOk(true), 600);
    }
  }, [musicAreaOk]);

  const hasExplicitSpeedChange =
    chartSeq !== undefined &&
    "speedChanges" in chartSeq &&
    (chartSeq.speedChanges.length !== chartSeq.bpmChanges.length ||
      chartSeq.speedChanges.some(
        (s, i) => s.bpm !== chartSeq.bpmChanges[i].bpm
      ));
  // const [displaySpeed, setDisplaySpeed] = useState<boolean>(false);
  const [auto, setAuto] = useState<boolean>(props.autoDefault);
  const [userOffset, setUserOffset_] = useState<number>(0);
  useEffect(() => {
    if (cid) {
      setUserOffset_(Number(localStorage.getItem(`offset-${cid}`)));
    }
  }, [cid]);
  const setUserOffset = useCallback(
    (v: number) => {
      setUserOffset_(v);
      if (cid) {
        localStorage.setItem(`offset-${cid}`, String(v));
      }
    },
    [cid]
  );

  const ref = useRef<HTMLDivElement>(null!);
  const {
    isTouch,
    screenWidth,
    screenHeight,
    rem,
    playUIScale,
    mobileStatusScale,
    largeResult,
  } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  const themeContext = useTheme();

  const statusSpace = useResizeDetector();
  const statusHide = !isMobile && statusSpace.height === 0;
  const statusOverlaps =
    !isMobile &&
    statusSpace.height &&
    statusSpace.height < 30 * playUIScale &&
    !statusHide;
  const mainWindowSpace = useResizeDetector();
  const readySmall =
    !!mainWindowSpace.height && mainWindowSpace.height < 27 * rem;

  const [bestScoreState, setBestScoreState] = useState<number>(0);
  const reloadBestScore = useCallback(() => {
    if (!auto && cid && lvIndex !== undefined && chartBrief?.levels[lvIndex]) {
      const data = getBestScore(cid, lvIndex);
      if (data && data.levelHash === chartBrief.levels[lvIndex].hash) {
        setBestScoreState(data.baseScore + data.chainScore + data.bigScore);
      }
    }
  }, [cid, auto, lvIndex, chartBrief]);
  useEffect(reloadBestScore, [reloadBestScore]);

  // start後true
  const [chartPlaying, setChartPlaying] = useState<boolean>(false);
  const [exitable, setExitable] = useState<Date | null>(null);
  const exitableNow = () =>
    exitable && exitable.getTime() < new Date().getTime();

  const ytPlayer = useRef<YouTubePlayer>(undefined);

  // ytPlayerから現在時刻を取得
  // offsetを引いた後の値
  const getCurrentTimeSec = useCallback(() => {
    if (ytPlayer.current?.getCurrentTime && chartSeq && chartPlaying) {
      return ytPlayer.current?.getCurrentTime() - chartSeq.offset - userOffset;
    }
  }, [chartSeq, chartPlaying, userOffset]);
  const {
    baseScore,
    chainScore,
    bigScore,
    score,
    chain,
    notesAll,
    resetNotesAll,
    hit,
    judgeCount,
    bigCount,
    bigTotal,
    end,
    lateTimes,
  } = useGameLogic(getCurrentTimeSec, auto, userOffset);

  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  // 準備完了画面を表示する
  const [ready, setReady] = useState<boolean>(false);
  // 譜面を中断した
  const [chartStopped, setChartStopped] = useState<boolean>(false);
  // 譜面をstartした (playingとは異なり、stop後も終了後もtrueのまま)
  const [chartStarted, setChartStarted] = useState<boolean>(false);
  // result画面を表示する
  const [showResult, setShowResult] = useState<boolean>(props.goResult);
  const [resultDate, setResultDate] = useState<Date>();

  const start = () => {
    // 再生中に呼んでもとくになにも起こらない
    if (ytPlayer.current?.getPlayerState() === 0) {
      ytPlayer.current?.seekTo(0, true);
    }
    ytPlayer.current?.playVideo();
    // 譜面の開始はonStart()で処理
  };
  const stop = useCallback(() => {
    if (chartPlaying) {
      setChartStopped(true);
      setChartPlaying(false);
      setExitable(
        (ex) =>
          new Date(Math.max(ex?.getTime() || 0, new Date().getTime() + 1000))
      );
      // 開始時の音量は問答無用で100っぽい?
      for (let i = 1; i < 10; i++) {
        setTimeout(() => {
          ytPlayer.current?.setVolume(((10 - i) * 100) / 10);
        }, i * 100);
        setTimeout(() => {
          ytPlayer.current?.pauseVideo();
        }, 1000);
      }
    }
  }, [chartPlaying]);
  const reset = useCallback(() => {
    if (chartSeq) {
      setChartStopped(false);
      setChartStarted(false);
      setChartPlaying(false);
      setExitable(null);
      setReady(true);
      resetNotesAll(chartSeq.notes);
      reloadBestScore();
    }
  }, [chartSeq, resetNotesAll, reloadBestScore]);
  const exit = () => {
    // router.replace(`/share/${cid}`);
    // history.back();
    window.close();
  };

  // youtube側のreadyイベント & chartSeqが読み込まれる の両方を満たしたら
  // resetを1回呼び、loadingを閉じ、初期化完了となる
  const [ytReady, setYtReady] = useState<boolean>(false);
  const [ytError, setYtError] = useState<number | null>(null);
  const [initDone, setInitDone] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const showLoadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (errorMsg) {
      if (showLoadingTimeout.current !== null) {
        clearTimeout(showLoadingTimeout.current);
      }
      setShowLoading(false);
      setInitDone(false);
      setExitable(new Date());
    } else if (ytReady && chartSeq && !initDone) {
      if (showLoadingTimeout.current !== null) {
        clearTimeout(showLoadingTimeout.current);
      }
      setShowLoading(false);
      reset();
      ref.current?.focus();
      setInitDone(true);
    } else {
      if (showLoadingTimeout.current === null) {
        showLoadingTimeout.current = setTimeout(
          () => setShowLoading(true),
          1500
        );
      }
    }
  }, [ytReady, chartSeq, reset, initDone, errorMsg]);
  useEffect(() => {
    if (!errorMsg) {
      if (apiErrorMsg) {
        setErrorMsg(apiErrorMsg);
      } else if (ytError !== null) {
        setErrorMsg(te("ytError", { code: ytError }));
      } else if (chartBrief && !chartBrief.ytId) {
        setErrorMsg(te("noYtId"));
      } else if (chartSeq && chartSeq.notes.length === 0) {
        setErrorMsg(te("seqEmpty"));
      }
    }
  }, [apiErrorMsg, ytError, chartBrief, chartSeq, errorMsg, te]);

  useEffect(() => {
    if (chartStarted && end) {
      if (
        cid &&
        !auto &&
        score > bestScoreState &&
        lvIndex !== undefined &&
        chartBrief?.levels[lvIndex]
      ) {
        setBestScore(cid, lvIndex, {
          levelHash: chartBrief.levels[lvIndex].hash,
          baseScore,
          chainScore,
          bigScore,
          judgeCount,
        });
      }
      const t = setTimeout(() => {
        setShowResult(true);
        setResultDate(new Date());
        setExitable(
          (ex) =>
            new Date(
              Math.max(
                ex?.getTime() || 0,
                new Date().getTime() +
                  resultAnimDelays.reduce((a, b) => a + b, 0)
              )
            )
        );
        stop();
      }, 1000);
      return () => clearTimeout(t);
    } else {
      setShowResult(props.goResult);
    }
  }, [
    chartStarted,
    end,
    chartSeq,
    score,
    bestScoreState,
    cid,
    auto,
    lvIndex,
    chartBrief,
    baseScore,
    chainScore,
    bigScore,
    judgeCount,
    stop,
    props.goResult,
  ]);

  const onReady = useCallback(() => {
    console.log("ready");
    setYtReady(true);
  }, []);
  const onStart = useCallback(() => {
    console.log("start");
    if (chartSeq) {
      setChartStopped(false);
      setReady(false);
      setChartPlaying(true);
      setChartStarted(true);
      setExitable(null);
      lateTimes.current = [];
      ytPlayer.current?.setVolume(100);
    }
    ref.current?.focus();
  }, [chartSeq, lateTimes]);
  const onStop = useCallback(() => {
    console.log("stop");
    if (chartPlaying) {
      setChartStopped(true);
      setChartPlaying(false);
    }
    if (ytPlayer.current?.getPlayerState() === 2) {
      // 終了ではなくpauseの場合のみ
      ytPlayer.current?.seekTo(0, true);
    }
    ref.current?.focus();
  }, [chartPlaying, ref]);
  const onError = useCallback((ec: number) => {
    setYtError(ec);
  }, []);

  // キーを押したとき一定時間光らせる
  const [barFlash, setBarFlash] = useState<boolean>(false);
  const flash = () => {
    setBarFlash(true);
    setTimeout(() => setBarFlash(false), 100);
  };

  return (
    <main
      className={
        "overflow-hidden w-full h-dvh relative select-none flex flex-col " +
        (chartPlaying ? "touch-none " : "touch-pan-y ")
      }
      tabIndex={0}
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === " " && ready && !chartPlaying) {
          start();
        } else if (
          e.key === " " &&
          ((chartStopped && !showResult) || (showResult && exitableNow()))
        ) {
          reset();
        } else if ((e.key === "Escape" || e.key === "Esc") && chartPlaying) {
          stop();
        } else if ((e.key === "Escape" || e.key === "Esc") && exitableNow()) {
          exit();
        } else {
          flash();
          hit();
        }
      }}
      onPointerDown={() => {
        flash();
        hit();
      }}
    >
      <div
        className={
          "flex-1 basis-0 min-h-0 w-full overflow-y-visible flex items-stretch " +
          (isMobile ? "flex-col" : "flex-row-reverse")
        }
      >
        <div
          className={
            (isMobile ? "" : "w-1/3 overflow-x-visible ") +
            "flex-none flex flex-col items-stretch"
          }
        >
          <MusicArea
            className={
              "transition-transform duration-500 ease-in-out " +
              (musicAreaOk ? "translate-y-0 " : "translate-y-[-40vw] ")
            }
            offset={(chartSeq?.offset || 0) + userOffset}
            lvType={lvType}
            lvIndex={lvIndex}
            isMobile={isMobile}
            ytPlayer={ytPlayer}
            chartBrief={chartBrief}
            onReady={onReady}
            onStart={onStart}
            onStop={onStop}
            onError={onError}
          />
          {!isMobile && (
            <>
              <StatusBox
                className={
                  "z-10 flex-none m-3 self-end " +
                  "transition-opacity duration-100 " +
                  (!statusHide && musicAreaOk
                    ? "ease-in opacity-100 "
                    : "ease-out opacity-0 ")
                }
                judgeCount={judgeCount}
                bigCount={bigCount}
                bigTotal={bigTotal}
                notesTotal={notesAll.length}
                isMobile={false}
                isTouch={isTouch}
              />
              <div className="flex-1 basis-0" ref={statusSpace.ref} />
            </>
          )}
        </div>
        <div className={"relative flex-1"} ref={mainWindowSpace.ref}>
          <FallingWindow
            className="absolute inset-0"
            notes={notesAll}
            getCurrentTimeSec={getCurrentTimeSec}
            playing={chartPlaying}
            setFPS={setFps}
            barFlash={barFlash}
            themeContext={themeContext}
          />
          <div
            className={
              "absoulte inset-0 " +
              "transition-all duration-200 " +
              (cloudsOk
                ? "opacity-100 translate-y-0 "
                : "opacity-0 translate-y-[-300px]")
            }
          >
            <ScoreDisp score={score} best={bestScoreState} auto={auto} />
            <ChainDisp chain={chain} fc={judgeCount[2] + judgeCount[3] === 0} />
          </div>
          {errorMsg ? (
            <InitErrorMessage msg={errorMsg} isTouch={isTouch} exit={exit} />
          ) : !initDone ? (
            <CenterBox
              className={
                "transition-opacity duration-200 ease-out " +
                (showLoading ? "opacity-100" : "opacity-0")
              }
            >
              <p>
                <LoadingSlime />
                Loading...
              </p>
            </CenterBox>
          ) : showResult && chartBrief ? (
            <Result
              auto={auto}
              lang={props.locale}
              date={resultDate || new Date()}
              cid={cid || ""}
              brief={chartBrief}
              lvName={chartBrief.levels.at(lvIndex || 0)?.name || ""}
              lvType={levelTypes.indexOf(
                chartBrief.levels.at(lvIndex || 0)?.type || ""
              )}
              lvDifficulty={chartBrief.levels.at(lvIndex || 0)?.difficulty || 0}
              baseScore100={
                props.goResult
                  ? exampleResult.baseScore100
                  : Math.floor(baseScore * 100)
              }
              chainScore100={
                props.goResult
                  ? exampleResult.chainScore100
                  : Math.floor(chainScore * 100)
              }
              bigScore100={
                props.goResult
                  ? exampleResult.bigScore100
                  : Math.floor(bigScore * 100)
              }
              score100={
                props.goResult
                  ? exampleResult.score100
                  : Math.floor(score * 100)
              }
              judgeCount={
                props.goResult ? exampleResult.judgeCount : judgeCount
              }
              bigCount={props.goResult ? exampleResult.bigCount : bigCount}
              reset={reset}
              exit={exit}
              isTouch={isTouch}
              newRecord={
                score > bestScoreState &&
                !auto &&
                lvIndex !== undefined &&
                chartBrief?.levels[lvIndex] !== undefined
                  ? score - bestScoreState
                  : 0
              }
              largeResult={largeResult}
            />
          ) : ready ? (
            <ReadyMessage
              isTouch={isTouch}
              start={start}
              exit={exit}
              auto={auto}
              setAuto={setAuto}
              userOffset={userOffset}
              setUserOffset={setUserOffset}
              editing={editing}
              lateTimes={lateTimes.current}
              small={readySmall}
            />
          ) : chartStopped ? (
            <StopMessage isTouch={isTouch} reset={reset} exit={exit} />
          ) : null}
        </div>
      </div>
      <div
        className={
          "relative w-full " +
          "transition-transform duration-200 ease-out " +
          (initAnim ? "translate-y-0 " : "translate-y-[30vh] ")
        }
        style={{
          height: isMobile ? 6 * rem * mobileStatusScale : "10vh",
          maxHeight: "15vh",
        }}
      >
        <div
          className={
            "-z-30 absolute inset-x-0 bottom-0 " +
            "bg-gradient-to-t from-lime-600 via-lime-500 to-lime-200 " +
            "dark:from-lime-900 dark:via-lime-800 dark:to-lime-700 "
          }
          style={{ top: "-1rem" }}
        />
        {chartSeq && (
          <RhythmicalSlime
            className="-z-10 absolute "
            style={{
              bottom: "100%",
              right: isMobile ? "1rem" : statusOverlaps ? 15 * rem : "1rem",
            }}
            signature={chartSeq.signature}
            getCurrentTimeSec={getCurrentTimeSec}
            playing={chartPlaying}
            bpmChanges={chartSeq?.bpmChanges}
          />
        )}
        <BPMSign
          className={
            "transition-opacity duration-200 ease-out " +
            (initAnim && chartSeq ? "opacity-100 " : "opacity-0 ")
          }
          chartPlaying={chartPlaying}
          chartSeq={chartSeq || null}
          getCurrentTimeSec={getCurrentTimeSec}
          hasExplicitSpeedChange={hasExplicitSpeedChange && displaySpeed}
        />
        {isMobile && (
          <>
            <StatusBox
              className="absolute inset-0 z-10"
              style={{
                margin: 1 * rem * mobileStatusScale,
              }}
              judgeCount={judgeCount}
              bigCount={bigCount}
              bigTotal={bigTotal}
              notesTotal={notesAll.length}
              isMobile={true}
              isTouch={true /* isTouch がfalseの場合の表示は調整してない */}
            />
            {showFps && (
              <span className="absolute left-3 bottom-full">[{fps} FPS]</span>
            )}
          </>
        )}
        {!isMobile && (
          <div className="absolute bottom-2 left-3 opacity-50">
            <span className="inline-block">Falling Nikochan</span>
            <span className="inline-block">
              <span className="ml-2">ver.</span>
              <span className="ml-1">{process.env.buildVersion}</span>
            </span>
            {showFps && <span className="inline-block ml-3">[{fps} FPS]</span>}
          </div>
        )}
      </div>
      {!isMobile && statusHide && showResult && (
        <StatusBox
          className="z-20 absolute my-auto h-max inset-y-0"
          style={{ right: "0.75rem" }}
          judgeCount={judgeCount}
          bigCount={bigCount}
          bigTotal={bigTotal}
          notesTotal={notesAll.length}
          isMobile={false}
          isTouch={isTouch}
        />
      )}
    </main>
  );
}
