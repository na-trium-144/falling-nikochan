import { ChartBrief } from "@/chartFormat/chart";
import { linkStyle1 } from "@/common/linkStyle";
import { LoadingSlime } from "@/common/loadingSlime";
import { RightOne } from "@icon-park/react";
import Link from "next/link";
import { useState } from "react";

interface Props {
  recentBrief: { cid: string; fetched: boolean; brief?: ChartBrief }[];
  maxRow: number;
  fetchAdditional?: () => void;
  creator?: boolean;
  href: (cid: string) => string;
  newTab?: boolean;
}
export function ChartList(props: Props) {
  const [additionalOpen, setAdditionalOpen] = useState<boolean>(false);

  const fetching = props.recentBrief
    .slice(0, props.maxRow)
    .some(({ fetched }) => !fetched);
  const fetchingAdditional = props.recentBrief.some(({ fetched }) => !fetched);
  return (
    <div className="relative min-h-4">
      <div className={"absolute top-0 left-2 " + (fetching ? "" : "hidden ")}>
        <LoadingSlime />
        Loading...
      </div>
      {props.recentBrief.length > 0 ? (
        <>
          <ul className="ml-3">
            {props.recentBrief.slice(0, props.maxRow).map(({ cid, brief }) => (
              <ChartListItem
                invisible={fetching}
                key={cid}
                cid={cid}
                brief={brief}
                href={props.href(cid)}
                creator={props.creator}
                newTab={props.newTab}
              />
            ))}
          </ul>
          {props.recentBrief.length >= props.maxRow &&
            (additionalOpen ? (
              <div className="relative min-h-4">
                <div
                  className={
                    "absolute top-1 left-2 " +
                    (fetchingAdditional ? "" : "hidden ")
                  }
                >
                  <LoadingSlime />
                  Loading...
                </div>
                <ul className="ml-3">
                  {props.recentBrief
                    .slice(props.maxRow)
                    .map(({ cid, fetched, brief }) => (
                      <ChartListItem
                        invisible={fetchingAdditional}
                        key={cid}
                        cid={cid}
                        brief={brief}
                        href={props.href(cid)}
                        creator={props.creator}
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
                <span className="ml-5">すべて表示</span>
                <span className="ml-1">
                  ({props.recentBrief.length - props.maxRow})
                </span>
              </button>
            ))}
        </>
      ) : (
        <div className="pl-2">まだありません</div>
      )}
    </div>
  );
}
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
    <li
      className={
        "flex flex-row items-start w-full " +
        (props.invisible ? "invisible " : "")
      }
    >
      <span className="flex-none mr-2">•</span>
      {props.newTab ? (
        <a
          href={props.href}
          className={"flex-1 min-w-0 " + linkStyle1}
          target="_blank"
        >
          <ChartListItemChildren {...props} />
        </a>
      ) : (
        <Link
          href={props.href}
          className={"flex-1 min-w-0 " + linkStyle1}
          prefetch={false}
        >
          <ChartListItemChildren {...props} />
        </Link>
      )}
    </li>
  );
}
function ChartListItemChildren(props: CProps) {
  return (
    <>
      <span className="inline-block">
        <span className="inline-block ">{props.cid}:</span>
        {props.original && (
          <span className="inline-block ml-2 text-sm">(オリジナル曲)</span>
        )}
        <span className="inline-block ml-2 font-title">
          {props.brief?.title}
        </span>
      </span>
      {!props.original && props.brief?.composer && (
        <span className="hidden main-wide:inline-block ml-1 text-sm">
          <span className="">/</span>
          <span className="ml-1 font-title ">{props.brief.composer}</span>
        </span>
      )}
      {props.creator && (
        <span className="inline-block ml-2 text-sm">
          <span className="">by</span>
          <span className="ml-1 font-title ">{props.brief?.chartCreator}</span>
        </span>
      )}
    </>
  );
}
