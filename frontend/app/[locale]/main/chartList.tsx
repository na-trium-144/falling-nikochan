"use client";
import { ChartBrief } from "@falling-nikochan/chart";
import { linkStyle1 } from "@/common/linkStyle.js";
import { ArrowRight } from "@icon-park/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  chartListMaxRow,
  ChartListType,
  useChartListFetcher,
} from "./fetch.js";
import { SlimeSVG } from "@/common/slime.js";
import { useStandaloneDetector } from "@/common/pwaInstall.js";
import { IndexMain } from "./main.js";
import { useShareModal } from "./shareModal.jsx";

interface PProps {
  locale: string;
  title: string;
  hiddenPage?: boolean;
  type: ChartListType;
}
export default function ChartListPage(props: PProps) {
  const { modal, openModal } = useShareModal(props.locale);

  return (
    <IndexMain
      title={props.title}
      tabKey="play"
      hiddenPage={props.hiddenPage}
      locale={props.locale}
      modal={modal}
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
        fetchAll
        creator
        href={(cid) => `/share/${cid}`}
        onClick={openModal}
        showLoading
        moreHref=""
      />
    </IndexMain>
  );
}

interface Props {
  type: ChartListType;
  fetchAll?: boolean;
  creator?: boolean;
  showLoading?: boolean;
  dateDiff?: boolean;
  href: (cid: string) => string;
  onClick?: (cid: string, brief?: ChartBrief) => void;
  newTab?: boolean;
  moreHref: string;
}
export function ChartList(props: Props) {
  const t = useTranslations("main.chartList");
  const te = useTranslations("error");
  const briefs = useChartListFetcher(props.type, !!props.fetchAll);
  const maxRow =
    Array.isArray(briefs) && props.fetchAll ? briefs.length : chartListMaxRow;
  const fetching =
    briefs === undefined ||
    (Array.isArray(briefs) &&
      briefs.slice(0, maxRow).some(({ fetched }) => !fetched));
  return (
    <>
      <ul
        className="grid w-full justify-items-start items-center "
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(min(18rem, 100%), 1fr))`,
        }}
      >
        {Array.isArray(briefs) && briefs.length > 0 && (
          <>
            {briefs.slice(0, maxRow).map(({ cid, brief, original }) => (
              <ChartListItem
                invisible={fetching}
                key={cid}
                cid={cid}
                brief={brief}
                href={props.href(cid)}
                onClick={
                  props.onClick ? () => props.onClick!(cid, brief) : undefined
                }
                creator={props.creator}
                original={original}
                newTab={props.newTab}
                dateDiff={props.dateDiff}
              />
            ))}
          </>
        )}
        <div
          className={
            "w-max pl-6 " + (fetching && props.showLoading ? "" : "hidden ")
          }
        >
          <SlimeSVG />
          Loading...
        </div>
        {briefs === "error" && (
          <div className="w-max pl-6 ">{te("fetchError")}</div>
        )}
        {Array.from(new Array(5)).map((_, i) => (
          <span key={i} />
        ))}
      </ul>
      {Array.isArray(briefs) && briefs.length > maxRow && (
        <Link
          className={
            "block w-max mx-auto mt-1 " +
            (fetching ? "invisible " : "") +
            linkStyle1
          }
          href={props.moreHref}
          prefetch={!process.env.NO_PREFETCH}
        >
          {t("showAll")}
          {/*<span className="ml-1">
              ({briefs.length /*- props.maxRow* /})
            </span>*/}
          <ArrowRight
            className="inline-block align-middle ml-2 "
            theme="filled"
          />
        </Link>
      )}
      {Array.isArray(briefs) && briefs.length === 0 && (
        <div className="pl-2">{t("empty")}</div>
      )}
    </>
  );
}

const chartListStyle =
  "block w-full text-left cursor-pointer " +
  "hover:shadow active:shadow-inner rounded px-1 py-0.5 my-0.5 " +
  "hover:mt-0 hover:mb-1 active:mt-0.5 active:mb-0.5 " +
  "hover:bg-sky-200/50 active:bg-sky-300/50 " +
  "dark:hover:bg-orange-800/50 dark:active:bg-orange-900/50 ";
interface CProps {
  cid: string;
  brief?: ChartBrief;
  href: string;
  onClick?: () => void;
  creator?: boolean;
  original?: boolean;
  newTab?: boolean;
  dateDiff?: boolean;
  invisible?: boolean;
  hidden?: boolean;
}
export function ChartListItem(props: CProps) {
  const isStandalone = useStandaloneDetector();
  const [appearing, setAppearing] = useState<boolean>(false);
  useEffect(() => {
    requestAnimationFrame(() =>
      setAppearing(!props.hidden && !props.invisible),
    );
  }, [props.hidden, props.invisible]);
  return (
    <li
      className={
        "w-full h-max transition-opacity ease-out duration-200 " +
        (props.hidden
          ? "hidden opacity-0 "
          : props.invisible
            ? "hidden opacity-0 " /*invisible*/
            : appearing
              ? "opacity-100 "
              : "opacity-0 ")
      }
    >
      {props.onClick || (props.newTab && !isStandalone) ? (
        <a
          href={props.href}
          className={chartListStyle}
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
  return (
    <div className="flex flex-row items-center space-x-2 ">
      <div className="flex-none ">
        {props.brief?.ytId && (
          <img
            className="h-9 w-16 object-cover object-center "
            src={`https://i.ytimg.com/vi/${props.brief?.ytId}/default.jpg`}
          />
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
