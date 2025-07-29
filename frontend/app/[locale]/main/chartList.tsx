"use client";
import { ChartBrief, levelTypes } from "@falling-nikochan/chart";
import { linkStyle1 } from "@/common/linkStyle.js";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { RefObject, useEffect, useRef, useState } from "react";
import { SlimeSVG } from "@/common/slime.js";
import { useStandaloneDetector } from "@/common/pwaInstall.js";
import { IndexMain } from "./main.js";
import { getRecent, updateRecent } from "@/common/recent.js";
import { TabKeys } from "@/common/footer.jsx";
import { BadgeStatus, getBadge, LevelBadge } from "@/common/levelBadge.jsx";
import { getBestScore } from "@/common/bestScore.js";
import { useSharePageModal } from "@/common/sharePageModal.jsx";
import { fetchBrief } from "@/common/briefCache.js";
import { useResizeDetector } from "react-resize-detector";
import { useDisplayMode } from "@/scale.jsx";

interface PProps {
  locale: string;
  title: string;
  tabKey: TabKeys;
  mobileTabKey: "top" | "play";
  type: ChartListType;
  dateDiff?: boolean;
  badge?: boolean;
}
export default function ChartListPage(props: PProps) {
  const { openModal, openShareInternal } = useSharePageModal();
  const boxSize = useResizeDetector();
  const { rem } = useDisplayMode();
  return (
    <IndexMain
      title={props.title}
      tabKey={props.tabKey}
      mobileTabKey={props.mobileTabKey}
      locale={props.locale}
      boxRef={boxSize.ref as RefObject<HTMLDivElement | null>}
    >
      <h3
        className={
          "flex-none mb-2 text-xl font-bold font-title " +
          "hidden main-wide:block "
        }
      >
        {props.title}
      </h3>
      <ChartList
        type={props.type}
        creator
        href={(cid) => `/share/${cid}`}
        onClick={openModal}
        onClickMobile={openShareInternal}
        showLoading
        dateDiff={props.dateDiff}
        moreHref={null}
        badge={props.badge}
        containerRef={boxSize.ref as RefObject<HTMLDivElement | null>}
        containerHeight={
          boxSize.height ? boxSize.height - (12 / 4) * rem : undefined
        }
      />
    </IndexMain>
  );
}

export type ChartListType = "recent" | "recentEdit" | "popular" | "latest";

export interface ChartLineBrief {
  cid: string;
  fetching?: boolean;
  fetched: boolean;
  brief?: ChartBrief;
  original?: boolean;
}
type ErrorMsg = { status: number | null; message: string };
const chartListMaxRow = 6;
interface Props {
  type?: ChartListType;
  briefs?:
    | ChartLineBrief[]
    | { status: number | null; message: string }
    | undefined;
  maxRow?: number;
  fetchAll?: boolean;
  containerHeight?: number;
  containerRef?: RefObject<HTMLElement | null>;
  creator?: boolean;
  showLoading?: boolean; // briefsがundefinedか、briefsにfetched:falseが含まれる場合にloadingを表示する
  dateDiff?: boolean;
  search?: boolean;
  href: (cid: string) => string;
  onClick?: (cid: string, brief?: ChartBrief) => void;
  onClickMobile?: (cid: string, brief?: ChartBrief) => void;
  newTab?: boolean;
  moreHref?: string | null;
  onMoreClick?: () => void;
  badge?: boolean;
}
export function ChartList(props: Props) {
  const t = useTranslations("main.chartList");
  const te = useTranslations("error");

  // props.briefs が初期値 (prerenderされたsample譜面リストなどの場合はすでにfetch済みのbriefを渡し、そうでない場合はChartList内でfetchする)
  const [briefs, setBriefs] = useState<
    (ChartLineBrief | null)[] | ErrorMsg | undefined
  >(props.briefs || undefined);
  const prevPropBriefs = useRef<ChartLineBrief[] | ErrorMsg | undefined>(
    props.briefs
  );
  useEffect(() => {
    if (props.briefs !== prevPropBriefs.current) {
      setBriefs(props.briefs);
      prevPropBriefs.current = props.briefs;
    }
  }, [props.briefs]);
  useEffect(() => {
    // 譜面リストのfetch (中身のbriefのfetchは別で行う)
    switch (props.type) {
      case "recent":
        setBriefs(
          getRecent("play")
            .reverse()
            .map((cid) => ({ cid, fetched: false }))
        );
        break;
      case "recentEdit":
        setBriefs(
          getRecent("edit")
            .reverse()
            .map((cid) => ({ cid, fetched: false }))
        );
        break;
      case "latest":
      case "popular":
        void (async () => {
          try {
            const latestRes = await fetch(
              process.env.BACKEND_PREFIX + `/api/${props.type}`,
              { cache: "default" }
            );
            if (latestRes.ok) {
              const latestCId = (await latestRes.json()) as { cid: string }[];
              setBriefs(latestCId.map(({ cid }) => ({ cid, fetched: false })));
            } else {
              try {
                setBriefs({
                  status: latestRes.status,
                  message: (await latestRes.json()).message,
                });
              } catch {
                setBriefs({ status: latestRes.status, message: "" });
              }
            }
          } catch (e) {
            console.error(e);
            setBriefs({ status: null, message: "fetchError" });
          }
        })();
    }
  }, [props.type]);

  const ulSize = useResizeDetector();
  const { rem } = useDisplayMode();
  const itemMinWidth = 18; // * rem
  const itemMinHeight = 11 / 4; // h-10 + gap-1
  const ulCols = ulSize.width
    ? Math.floor(ulSize.width / (itemMinWidth * rem))
    : 1;
  // 現在の画面サイズに応じた最大サイズ
  const [pagination, setPagination] = useState<number>(1);
  const maxRow: number =
    props.maxRow ||
    (props.containerHeight
      ? Math.ceil(
          (props.containerHeight * pagination) / (itemMinHeight * rem)
        ) * ulCols
      : chartListMaxRow);
  const fetchAll = props.fetchAll;

  useEffect(() => {
    if (Array.isArray(briefs)) {
      let changed = false;
      for (let i = 0; i < briefs.length && (fetchAll || i < maxRow); i++) {
        const b = briefs[i];
        if (b !== null && !b.fetched && !b.fetching) {
          b.fetching = true;
          changed = true;
          fetchBrief(b.cid).then(({ brief, is404 }) => {
            setBriefs((briefs) => {
              if (Array.isArray(briefs)) {
                if (is404) {
                  briefs[i] = null;
                } else {
                  briefs[i]!.fetched = true;
                  briefs[i]!.brief = brief;
                }
                return briefs.slice();
              } else {
                // そんなことあるのか...?
                return briefs;
              }
            });
          });
        }
      }
      if (changed) {
        setBriefs(briefs.slice());
      }
    }
  }, [briefs, props.type, maxRow, fetchAll]);
  useEffect(() => {
    if (Array.isArray(briefs)) {
      if (props.type === "recent") {
        updateRecent(
          "play",
          briefs
            .filter((b) => b !== null)
            .map(({ cid }) => cid)
            .reverse()
        );
      }
      if (props.type === "recentEdit") {
        updateRecent(
          "edit",
          briefs
            .filter((b) => b !== null)
            .map(({ cid }) => cid)
            .reverse()
        );
      }
    }
  }, [briefs, props.type]);

  const filteredBriefs: ChartLineBrief[] | ErrorMsg | undefined = Array.isArray(
    briefs
  )
    ? fetchAll
      ? briefs.filter((b) => b !== null)
      : briefs.filter((b) => b !== null).slice(0, maxRow)
    : briefs;
  const filteredNumRows =
    Array.isArray(filteredBriefs) && (fetchAll || props.containerRef)
      ? filteredBriefs.length
      : maxRow;
  // filteredBriefs内で最初にfetch中のbriefのインデックス
  // すべてfetch完了なら-1
  const firstFetchingIndex: number =
    filteredBriefs === undefined
      ? 0
      : Array.isArray(filteredBriefs)
        ? filteredBriefs.findIndex((b) => !b.fetched)
        : -1;
  const padHeightForScroll: number =
    Array.isArray(briefs) &&
    briefs.filter((b) => b !== null).length > maxRow &&
    props.containerRef
      ? 2 * rem
      : 0;

  useEffect(() => {
    const onScroll = () => {
      if (
        props.containerRef?.current &&
        padHeightForScroll > 0 &&
        props.containerRef.current.scrollTop +
          props.containerRef.current.clientHeight >=
          props.containerRef.current.scrollHeight - padHeightForScroll
      ) {
        setPagination(
          Math.floor(
            props.containerRef.current.scrollHeight /
              props.containerRef.current.clientHeight
          ) + 1
        );
      }
    };
    if (props.containerRef?.current) {
      props.containerRef.current.addEventListener("scroll", onScroll);
      return () =>
        props.containerRef?.current?.removeEventListener("scroll", onScroll);
    }
  }, [props.containerRef, padHeightForScroll, itemMinHeight, rem]);

  return (
    <div className="relative w-full h-max ">
      <ul
        ref={ulSize.ref}
        className="grid w-full mx-auto justify-items-start items-center gap-1 mb-1 "
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(min(${itemMinWidth}rem, 100%), 1fr))`,
          // max 3 columns
          maxWidth: 4 * itemMinWidth - 0.1 + "rem",
        }}
      >
        {Array.from(new Array(filteredNumRows)).map((_, i) =>
          Array.isArray(filteredBriefs) &&
          filteredBriefs.at(i) &&
          (firstFetchingIndex === -1 || i < firstFetchingIndex) ? (
            <ChartListItem
              key={i}
              cid={filteredBriefs.at(i)!.cid}
              brief={filteredBriefs.at(i)!.brief}
              href={props.href(filteredBriefs.at(i)!.cid)}
              onClick={
                props.onClick
                  ? () =>
                      props.onClick!(
                        filteredBriefs.at(i)!.cid,
                        filteredBriefs.at(i)!.brief
                      )
                  : undefined
              }
              onClickMobile={
                props.onClickMobile
                  ? () =>
                      props.onClickMobile!(
                        filteredBriefs.at(i)!.cid,
                        filteredBriefs.at(i)!.brief
                      )
                  : undefined
              }
              creator={props.creator}
              original={filteredBriefs.at(i)!.original}
              newTab={props.newTab}
              dateDiff={props.dateDiff}
              badge={props.badge}
            />
          ) : (
            <li
              key={i}
              className={
                "w-full max-w-108 mx-auto h-10 rounded " +
                "bg-sky-200/25 dark:bg-orange-800/10 "
              }
            />
          )
        )}
      </ul>
      {firstFetchingIndex >= 0 && props.showLoading ? (
        <div
          className="absolute inset-x-0 w-max mx-auto "
          style={{
            top:
              0.5 +
              itemMinHeight * Math.round(firstFetchingIndex / ulCols) +
              "rem",
          }}
        >
          <SlimeSVG />
          Loading...
        </div>
      ) : briefs && "message" in briefs ? (
        <div className="absolute inset-x-0 top-2 w-max mx-auto ">
          {briefs.status ? `${briefs.status}: ` : ""}
          {te.has(`api.${briefs.message}`)
            ? te(`api.${briefs.message}`)
            : te("unknownApiError")}
        </div>
      ) : Array.isArray(briefs) && briefs.length === 0 ? (
        <div className="absolute inset-x-0 top-2 w-max mx-auto ">
          {props.search ? t("notFound") : t("empty")}
        </div>
      ) : null}
      {Array.isArray(briefs) &&
      briefs.filter((b) => b !== null).length > maxRow ? (
        props.onMoreClick ? (
          <button
            className={
              "block w-max mx-auto mt-2 " +
              (firstFetchingIndex >= 0 ? "invisible " : "") +
              linkStyle1
            }
            onClick={props.onMoreClick}
          >
            {t("showAll")}
            <ArrowRight
              className="inline-block align-middle ml-2 "
              theme="filled"
            />
          </button>
        ) : props.moreHref ? (
          <Link
            className={
              "block w-max mx-auto mt-2 " +
              (firstFetchingIndex >= 0 ? "invisible " : "") +
              linkStyle1
            }
            href={props.moreHref}
            prefetch={!process.env.NO_PREFETCH}
          >
            {t("showAll")}
            <ArrowRight
              className="inline-block align-middle ml-2 "
              theme="filled"
            />
          </Link>
        ) : null
      ) : props.moreHref || props.onMoreClick ? (
        <div className="w-0 h-6 mt-2 " />
      ) : null}
      {padHeightForScroll > 0 && (
        <div className="w-0" style={{ height: padHeightForScroll }} />
      )}
    </div>
  );
}

const chartListStyle =
  "block w-full text-left cursor-pointer " +
  "hover:shadow active:shadow-inner rounded px-1 py-0.5 " +
  "hover:-translate-y-0.5 active:translate-y-0 " +
  "hover:bg-sky-200/50 active:bg-sky-300/50 " +
  "dark:hover:bg-orange-800/50 dark:active:bg-orange-900/50 " +
  "bg-sky-200/25 dark:bg-orange-800/10 ";
interface CProps {
  cid: string;
  brief?: ChartBrief;
  href: string;
  onClick?: () => void;
  onClickMobile?: () => void;
  creator?: boolean;
  original?: boolean;
  newTab?: boolean;
  dateDiff?: boolean;
  badge?: boolean;
}
export function ChartListItem(props: CProps) {
  const isStandalone = useStandaloneDetector();

  // ~36rem: 1列 -> 18~36rem -> max-width:27rem
  // ~54rem: 2列 -> 18~27rem
  // ~72rem: 3列 -> 18~24rem
  return (
    <li className={"w-full max-w-108 mx-auto h-max "}>
      {props.onClick || (props.newTab && !isStandalone) ? (
        <>
          <a
            href={props.href}
            className={
              chartListStyle +
              (props.onClickMobile ? "hidden main-wide:block " : "")
            }
            target={props.newTab ? "_blank" : undefined}
            onClick={
              props.onClick
                ? (e) => {
                    props.onClick!();
                    e.preventDefault();
                  }
                : undefined
            }
          >
            <ChartListItemChildren {...props} />
          </a>
          {props.onClickMobile && (
            <a
              href={props.href}
              className={chartListStyle + "main-wide:hidden "}
              onClick={(e) => {
                props.onClickMobile!();
                e.preventDefault();
              }}
            >
              <ChartListItemChildren {...props} />
            </a>
          )}
        </>
      ) : (
        <Link
          href={props.href}
          className={chartListStyle}
          prefetch={!process.env.NO_PREFETCH}
        >
          <ChartListItemChildren {...props} />
        </Link>
      )}
    </li>
  );
}
function ChartListItemChildren(props: CProps) {
  const [status, setStatus] = useState<BadgeStatus[]>([]);
  const levelColors =
    props.brief?.levels
      .filter((l) => !l.unlisted)
      .map((l) => levelTypes.indexOf(l.type)) || [];
  useEffect(() => {
    if (props.badge) {
      setStatus(
        props.brief?.levels
          .filter((l) => !l.unlisted)
          .map((l) => getBadge(getBestScore(props.cid, l.hash))) || []
      );
    } else {
      setStatus([]);
    }
  }, [props.cid, props.brief, props.badge]);

  return (
    <div className="relative flex flex-row items-center gap-2 ">
      <LevelBadge
        className="absolute top-0 -right-1"
        status={status}
        levels={levelColors}
        showDot
      />
      <div className="flex-none ">
        {props.brief?.ytId ? (
          <img
            className="h-9 w-16 object-cover object-center "
            src={`https://i.ytimg.com/vi/${props.brief?.ytId}/default.jpg`}
          />
        ) : (
          <div className="h-9 w-16 " />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col items-begin justify-center space-y-0.5">
        <div className="leading-4 overflow-x-clip overflow-y-visible ">
          <span className="text-xs/3">ID:</span>
          <span className="ml-1 text-sm/3">{props.cid}</span>
          {props.dateDiff && (
            <DateDiff
              className="ml-2 text-xs/3 text-nowrap text-slate-500 dark:text-stone-400"
              date={props.brief?.updatedAt || 0}
            />
          )}
          {props.original && (
            <span className="ml-2 text-xs/3">(オリジナル曲)</span>
          )}
          {props.creator && (
            <span
              className={
                "inline-block leading-3 max-w-full " +
                "overflow-x-clip overflow-y-visible text-nowrap text-ellipsis "
              }
            >
              <span className="ml-2 text-xs/3">by</span>
              <span className="ml-1 font-title text-sm/3">
                {props.brief?.chartCreator}
              </span>
            </span>
          )}
        </div>
        <div className="overflow-x-clip overflow-y-visible text-nowrap text-ellipsis leading-4 ">
          <span className="font-title text-base/4 ">{props.brief?.title}</span>
          {!props.original && props.brief?.composer && (
            <>
              <span className="ml-1 text-sm/4">/</span>
              <span className="ml-1 font-title text-sm/4">
                {props.brief.composer}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface DProps {
  className?: string;
  date: number;
}
function DateDiff(props: DProps) {
  const [output, setOutput] = useState<string | null>(null);
  useEffect(() => {
    const update = () => {
      const diffMilliSec =
        new Date(props.date).getTime() - new Date().getTime();
      const diffMin = diffMilliSec / 60000;
      const diffHour = diffMin / 60;
      const diffDay = diffHour / 24;
      const diffMonth = diffDay / 30;
      const formatter = new Intl.RelativeTimeFormat(undefined, {
        numeric: "always",
        style: "narrow",
      });
      if (Math.abs(diffHour) < 1) {
        setOutput(formatter.format(Math.trunc(diffMin), "minutes"));
      } else if (Math.abs(diffDay) < 1) {
        setOutput(formatter.format(Math.trunc(diffHour), "hours"));
      } else if (Math.abs(diffMonth) < 1) {
        setOutput(formatter.format(Math.trunc(diffDay), "days"));
      } else if (Math.abs(diffMonth) < 12) {
        setOutput(formatter.format(Math.trunc(diffMonth), "months"));
      } else {
        setOutput(null);
      }
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [props.date]);

  if (output) {
    return <span className={props.className}>({output})</span>;
  } else {
    return null;
  }
}
