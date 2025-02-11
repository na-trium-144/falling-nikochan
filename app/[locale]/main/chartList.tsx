import { ChartBrief } from "@/../../chartFormat/chart.js";
import { linkStyle1 } from "@/common/linkStyle.js";
import { LoadingSlime } from "@/common/loadingSlime.js";
import { RightOne } from "@icon-park/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

interface Props {
  recentBrief?: { cid: string; fetched: boolean; brief?: ChartBrief }[];
  maxRow: number;
  fetchAdditional?: () => void;
  creator?: boolean;
  original?: boolean;
  showLoading?: boolean;
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
    <div className="relative min-h-4">
      <div
        className={
          "absolute top-0 left-2 " +
          (fetching && props.showLoading ? "" : "hidden ")
        }
      >
        <LoadingSlime />
        Loading...
      </div>
      {props.recentBrief !== undefined &&
        (props.recentBrief.length > 0 ? (
          <>
            <ul className="ml-3">
              {props.recentBrief
                .slice(0, props.maxRow)
                .map(({ cid, brief }) => (
                  <ChartListItem
                    invisible={fetching}
                    key={cid}
                    cid={cid}
                    brief={brief}
                    href={props.href(cid)}
                    creator={props.creator}
                    original={props.original}
                    newTab={props.newTab}
                  />
                ))}
            </ul>
            {props.recentBrief.length > props.maxRow &&
              (additionalOpen ? (
                <div className="relative min-h-4">
                  <div
                    className={
                      "absolute top-1 left-2 " +
                      (fetchingAdditional && props.showLoading ? "" : "hidden ")
                    }
                  >
                    <LoadingSlime />
                    Loading...
                  </div>
                  <ul className="ml-3">
                    {props.recentBrief
                      .slice(props.maxRow)
                      .map(({ cid, brief }) => (
                        <ChartListItem
                          invisible={fetchingAdditional}
                          key={cid}
                          cid={cid}
                          brief={brief}
                          href={props.href(cid)}
                          creator={props.creator}
                          original={props.original}
                          newTab={props.newTab}
                        />
                      ))}
                  </ul>
                </div>
              ) : (
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
                  <RightOne
                    className="absolute left-0 bottom-1 "
                    theme="filled"
                  />
                  <span className="ml-5">{t("showAll")}</span>
                  <span className="ml-1">
                    ({props.recentBrief.length - props.maxRow})
                  </span>
                </button>
              ))}
          </>
        ) : (
          <div className="pl-2">{t("empty")}</div>
        ))}
    </div>
  );
}

const chartListStyle =
  "block hover:shadow hover:-translate-y-0.5 active:shadow-inner active:translate-y-0 rounded-lg " +
  "hover:bg-sky-200/50 active:bg-sky-300/50 " +
  "dark:hover:bg-orange-800/50 dark:active:bg-orange-900/50 ";
interface CProps {
  cid: string;
  brief?: ChartBrief;
  href: string;
  creator?: boolean;
  original?: boolean;
  newTab?: boolean;
  invisible?: boolean;
}
export function ChartListItem(props: CProps) {
  return (
    <li className={"w-full " + (props.invisible ? "invisible " : "")}>
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
    <div className="flex flex-row items-center p-1 space-x-1 ">
      <div className="flex-none h-9 w-12">
        {props.brief?.ytId && (
          <img
            className="max-w-full max-h-full"
            src={`https://i.ytimg.com/vi/${props.brief?.ytId}/default.jpg`}
          />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col items-begin justify-center">
        <div className="overflow-x-clip overflow-y-visible text-nowrap text-ellipsis leading-4 ">
          {props.original && (
            <span className="text-sm/3 mr-2">(オリジナル曲)</span>
          )}
          <span className="font-title text-base/4 ">{props.brief?.title}</span>
          {!props.original && props.brief?.composer && (
            <span className="ml-1 text-sm/3">
              <span className="">/</span>
              <span className="ml-1 font-title ">{props.brief.composer}</span>
            </span>
          )}
        </div>
        <div className="overflow-x-clip overflow-y-visible text-nowrap text-ellipsis leading-4 mt-0.5 ">
          <span className="text-xs/4">{props.cid}:</span>
          {props.creator && (
            <span className="ml-1 text-xs/4">
              <span className="">by</span>
              <span className="ml-1 font-title text-sm/4">
                {props.brief?.chartCreator}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
