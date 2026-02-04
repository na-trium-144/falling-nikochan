"use client";
import { ChartBrief, levelTypes } from "@falling-nikochan/chart";
import clsx from "clsx/lite";
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
import {
  skyFlatButtonBorderStyle1,
  skyFlatButtonBorderStyle2,
  skyFlatButtonStyle,
} from "@/common/flatButton.jsx";
import { ButtonHighlight, buttonShadowStyle } from "@/common/button.jsx";
import { APIError } from "@/common/apiError.js";

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
  return (
    <IndexMain
      title={props.title}
      tabKey={props.tabKey}
      mobileTabKey={props.mobileTabKey}
      locale={props.locale}
      boxRef={boxSize.ref as RefObject<HTMLDivElement | null>}
    >
      <section className="fn-sect">
        <h3 className={clsx("fn-heading-sect", "no-mobile")}>{props.title}</h3>
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
          containerHeight={boxSize.height} // 正確にはPCでは見出しなどの分実際に表示できるサイズは小さかったりするが、面倒だし、はみ出すくらいでよい
        />
      </section>
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
interface Props {
  type?: ChartListType;
  briefs?: ChartLineBrief[] | APIError | undefined;
  fetchAll?: boolean;
  fixedRows?: boolean; // 表示数を6個で固定する
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
    (ChartLineBrief | null)[] | APIError | undefined
  >(props.briefs || undefined);
  const prevPropBriefs = useRef<ChartLineBrief[] | APIError | undefined>(
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
              setBriefs(await APIError.fromRes(latestRes));
            }
          } catch (e) {
            console.error(e);
            setBriefs(APIError.fetchError());
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
  // 1ページあたりに表示できる最大数
  const maxRowPerPage = props.containerHeight
    ? Math.ceil(props.containerHeight / (itemMinHeight * rem)) * ulCols
    : undefined;
  // この個数は空でも枠を表示する
  const fixedRow = props.fixedRows ? 6 : 0;
  // 最大で表示する個数
  const maxRow = props.containerHeight ? maxRowPerPage! * pagination : fixedRow;
  const fetchAll = props.fetchAll;

  useEffect(() => {
    if (Array.isArray(briefs)) {
      let changed = false;
      for (
        let i = 0;
        i < briefs.length && (fetchAll || (maxRow && i < maxRow));
        i++
      ) {
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

  const filteredBriefs: ChartLineBrief[] | APIError | undefined = Array.isArray(
    briefs
  )
    ? fetchAll
      ? briefs.filter((b) => b !== null)
      : briefs.filter((b) => b !== null).slice(0, maxRow)
    : briefs;
  // エラーなどを除いた実際のbriefの項目数
  const filteredNumRows =
    Array.isArray(filteredBriefs) && (fetchAll || props.containerRef)
      ? filteredBriefs.length
      : 0;
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
    maxRow !== undefined &&
    briefs.filter((b) => b !== null).length > maxRow &&
    props.containerRef
      ? 2 * rem
      : 0;

  useEffect(() => {
    const onScroll = () => {
      if (
        props.containerRef?.current &&
        props.containerHeight &&
        padHeightForScroll > 0 &&
        maxRowPerPage
      ) {
        setPagination((pagination) =>
          Math.max(
            Math.floor(
              (props.containerRef!.current!.scrollTop +
                props.containerHeight!) /
                ((itemMinHeight * rem * maxRowPerPage!) / ulCols)
            ) + 1,
            pagination
          )
        );
      }
    };
    if (props.containerRef?.current) {
      props.containerRef.current.addEventListener("scroll", onScroll);
      return () =>
        props.containerRef?.current?.removeEventListener("scroll", onScroll);
    }
  }, [
    props.containerRef,
    padHeightForScroll,
    itemMinHeight,
    rem,
    maxRowPerPage,
    ulCols,
    props.containerHeight,
  ]);

  return (
    <div className="relative w-full h-max isolate">
      <ul ref={ulSize.ref} className="fn-chart-list">
        {Array.from(new Array(Math.max(filteredNumRows, fixedRow))).map(
          (_, i) =>
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
              <li key={i} className="fn-cl-item" />
            )
        )}
      </ul>
      {firstFetchingIndex >= 0 && props.showLoading ? (
        <div
          className="fn-cl-message"
          style={{
            top:
              itemMinHeight * Math.round(firstFetchingIndex / ulCols) + "rem",
          }}
        >
          <SlimeSVG />
          Loading...
        </div>
      ) : briefs && "message" in briefs ? (
        <div className="fn-cl-message">
          {{briefs.format(te)}
        </div>
      ) : Array.isArray(briefs) && briefs.length === 0 ? (
        <div className="fn-cl-message">
          {props.search ? t("notFound") : t("empty")}
        </div>
      ) : null}
      {Array.isArray(briefs) &&
      briefs.filter((b) => b !== null).length > maxRow ? (
        props.onMoreClick ? (
          <button
            className={clsx(
              "fn-cl-more fn-link-1",
              firstFetchingIndex >= 0 && "invisible"
            )}
            onClick={props.onMoreClick}
          >
            {t("showAll")}
            <ArrowRight
              className="inline-block align-middle ml-2"
              theme="filled"
            />
          </button>
        ) : props.moreHref ? (
          <Link
            className={clsx(
              "fn-cl-more fn-link-1",
              firstFetchingIndex >= 0 && "invisible"
            )}
            href={props.moreHref}
            prefetch={!process.env.NO_PREFETCH}
          >
            {t("showAll")}
            <ArrowRight
              className="inline-block align-middle ml-2"
              theme="filled"
            />
          </Link>
        ) : null
      ) : props.moreHref || props.onMoreClick ? (
        <div className="fn-cl-more" />
      ) : null}
      {padHeightForScroll > 0 && (
        <div className="w-0" style={{ height: padHeightForScroll }} />
      )}
    </div>
  );
}

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

  return (
    <li className="fn-cl-item">
      {props.onClick || (props.newTab && !isStandalone) ? (
        <>
          <a
            href={props.href}
            className={clsx(
              "fn-flat-button fn-sky",
              props.onClickMobile && "no-mobile"
            )}
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
            <span className="fn-glass-1" />
            <span className="fn-glass-2" />
            <ButtonHighlight />
            <ChartListItemChildren {...props} />
          </a>
          {props.onClickMobile && (
            <a
              href={props.href}
              className={clsx("fn-flat-button fn-sky", "no-pc")}
              onClick={(e) => {
                props.onClickMobile!();
                e.preventDefault();
              }}
            >
              <span className="fn-glass-1" />
              <span className="fn-glass-2" />
              <ButtonHighlight />
              <ChartListItemChildren {...props} />
            </a>
          )}
        </>
      ) : (
        <Link
          href={props.href}
          className={clsx("fn-flat-button fn-sky")}
          prefetch={!process.env.NO_PREFETCH}
        >
          <span className="fn-glass-1" />
          <span className="fn-glass-2" />
          <ButtonHighlight />
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
    <>
      <LevelBadge
        className="absolute z-10 top-0 -right-1"
        status={status}
        levels={levelColors}
        showDot
      />
      {props.brief?.ytId ? (
        <img
          className="fn-thumbnail"
          src={`https://i.ytimg.com/vi/${props.brief?.ytId}/default.jpg`}
        />
      ) : (
        <div className="fn-thumbnail" />
      )}
      <div className="fn-cl-content">
        <div className="leading-4 max-w-full">
          <span className="text-xs/3">ID:</span>
          <span className="ml-1 text-sm/3">{props.cid}</span>
          {props.dateDiff && (
            <DateDiff
              className="ml-2 text-xs/3 text-slate-500 dark:text-stone-400"
              date={props.brief?.updatedAt || 0}
            />
          )}
          {props.original && (
            <span className="ml-2 text-xs/3">(オリジナル曲)</span>
          )}
          {props.creator && (
            <span className="inline-block leading-3 fn-cl-clip">
              <span className="ml-2 text-xs/3">by</span>
              <span className="ml-1 font-title text-sm/3">
                {props.brief?.chartCreator}
              </span>
            </span>
          )}
        </div>
        <div className="leading-4 fn-cl-clip">
          <span className="font-title text-base/4">{props.brief?.title}</span>
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
    </>
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
    return <span className={clsx(props.className)}>({output})</span>;
  } else {
    return null;
  }
}
