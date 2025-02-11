import { ChartBrief } from "@/../../chartFormat/chart.js";
import { linkStyle1 } from "@/common/linkStyle.js";
import { LoadingSlime } from "@/common/loadingSlime.js";
import { RightOne } from "@icon-park/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChartLineBrief } from "./play/fetch.js";

interface Props {
  recentBrief?: ChartLineBrief[];
  maxRow: number;
  fetchAdditional?: () => void;
  creator?: boolean;
  showLoading?: boolean;
  dateDiff?: boolean;
  href: (cid: string) => string;
  newTab?: boolean;
}
export function ChartList(props: Props) {
  const t = useTranslations("main.chartList");
  const [additionalOpen, setAdditionalOpen] = useState<boolean>(false);

  const fetching =
    props.recentBrief === undefined ||
    props.recentBrief.slice(0, props.maxRow).some(({ fetched }) => !fetched);
  const fetchingAdditional =
    props.recentBrief === undefined ||
    props.recentBrief.some(({ fetched }) => !fetched);
  return (
    <>
      <ul
        className="grid w-full justify-items-start items-center "
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(min(18rem, 100%), 1fr))`,
        }}
      >
        {props.recentBrief !== undefined && props.recentBrief.length > 0 && (
          <>
            {props.recentBrief
              .slice(0, props.maxRow)
              .map(({ cid, brief, original }) => (
                <ChartListItem
                  invisible={fetching}
                  key={cid}
                  cid={cid}
                  brief={brief}
                  href={props.href(cid)}
                  creator={props.creator}
                  original={original}
                  newTab={props.newTab}
                  dateDiff={props.dateDiff}
                />
              ))}
            {additionalOpen && (
              <>
                {props.recentBrief
                  .slice(props.maxRow)
                  .map(({ cid, brief, original }) => (
                    <ChartListItem
                      invisible={fetchingAdditional}
                      key={cid}
                      cid={cid}
                      brief={brief}
                      href={props.href(cid)}
                      creator={props.creator}
                      original={original}
                      newTab={props.newTab}
                      dateDiff={props.dateDiff}
                    />
                  ))}
              </>
            )}
          </>
        )}
        <div
          className={
            "w-max pl-6 " +
            ((fetching || (additionalOpen && fetchingAdditional)) &&
            props.showLoading
              ? ""
              : "hidden ")
          }
        >
          <LoadingSlime />
          Loading...
        </div>
        {Array.from(new Array(5)).map((_, i) => (
          <span key={i} />
        ))}
      </ul>
      {props.recentBrief !== undefined &&
        props.recentBrief.length > props.maxRow &&
        !additionalOpen && (
          <button
            className={
              "block relative ml-5 mt-1 " +
              (fetching ? "invisible " : "") +
              linkStyle1
            }
            onClick={() => {
              setAdditionalOpen(!additionalOpen);
              if (fetchingAdditional && props.fetchAdditional) {
                props.fetchAdditional();
              }
            }}
          >
            <RightOne className="absolute left-0 bottom-1 " theme="filled" />
            <span className="ml-5">{t("showAll")}</span>
            <span className="ml-1">
              ({props.recentBrief.length - props.maxRow})
            </span>
          </button>
        )}
      {props.recentBrief !== undefined && props.recentBrief.length === 0 && (
        <div className="pl-2">{t("empty")}</div>
      )}
    </>
  );
}

const chartListStyle =
  "block hover:shadow active:shadow-inner rounded-lg px-1 py-0.5 my-0.5 " +
  "hover:mt-0 hover:mb-1 active:mt-0.5 active:mb-0.5 " +
  "hover:bg-sky-200/50 active:bg-sky-300/50 " +
  "dark:hover:bg-orange-800/50 dark:active:bg-orange-900/50 ";
interface CProps {
  cid: string;
  brief?: ChartBrief;
  href: string;
  creator?: boolean;
  original?: boolean;
  newTab?: boolean;
  dateDiff?: boolean;
  invisible?: boolean;
}
export function ChartListItem(props: CProps) {
  return (
    <li
      className={
        "w-full h-max " + (props.invisible ? "hidden " /*invisible*/ : "")
      }
    >
      {props.newTab ? (
        <a href={props.href} className={chartListStyle} target="_blank">
          <ChartListItemChildren {...props} />
        </a>
      ) : (
        <Link href={props.href} className={chartListStyle} prefetch={false}>
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
