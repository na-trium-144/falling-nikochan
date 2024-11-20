import { ChartBrief } from "@/chartFormat/chart";
import { linkStyle1 } from "@/common/linkStyle";
import { LoadingSlime } from "@/common/loadingSlime";
import { RightOne } from "@icon-park/react";
import Link from "next/link";
import { useState } from "react";

interface Props {
  recentBrief?: { cid?: string; brief?: ChartBrief }[];
  hasRecentAdditional: number;
  recentBriefAdditional?: { cid?: string; brief?: ChartBrief }[];
  fetchAdditional: () => void;
  creator?: boolean;
  href: (cid: string) => string;
  newTab?: boolean;
}
export function ChartList(props: Props) {
  const [additionalOpen, setAdditionalOpen] = useState<boolean>(false);

  const fetching = props.recentBrief === undefined;
  const fetchingAdditional = props.recentBriefAdditional === undefined;
  return (
    <>
      <p className={"pl-2 " + (fetching ? "" : "hidden ")}>
        <LoadingSlime />
        Loading...
      </p>
      <div className={fetching ? "hidden " : ""}>
        {props.recentBrief && props.recentBrief.length > 0 ? (
          <>
            <ul className="ml-3">
              {props.recentBrief.map(
                ({ cid, brief }) =>
                  cid && (
                    <ChartListItem
                      key={cid}
                      cid={cid}
                      brief={brief}
                      href={props.href(cid)}
                      creator={props.creator}
                      newTab={props.newTab}
                    />
                  )
              )}
            </ul>
            {props.hasRecentAdditional > 0 &&
              (additionalOpen ? (
                <>
                  <p
                    className={
                      "mt-1 pl-2 " + (fetchingAdditional ? "" : "hidden ")
                    }
                  >
                    <LoadingSlime />
                    Loading...
                  </p>
                  <div className={fetchingAdditional ? "hidden " : ""}>
                    <ul className="ml-3">
                      {props.recentBriefAdditional?.map(
                        ({ cid, brief }) =>
                          cid && (
                            <ChartListItem
                              key={cid}
                              cid={cid}
                              brief={brief}
                              href={props.href(cid)}
                              creator={props.creator}
                              newTab={props.newTab}
                            />
                          )
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <button
                  className={"block relative ml-5 mt-1 " + linkStyle1}
                  onClick={() => {
                    setAdditionalOpen(!additionalOpen);
                    if (fetchingAdditional) {
                      props.fetchAdditional();
                    }
                  }}
                >
                  <RightOne
                    className="absolute left-0 bottom-1 "
                    theme="filled"
                  />
                  <span className="ml-5">すべて表示</span>
                  <span className="ml-1">({props.hasRecentAdditional})</span>
                </button>
              ))}
          </>
        ) : (
          <p className="pl-2">まだありません</p>
        )}
      </div>
    </>
  );
}
interface CProps {
  cid: string;
  brief?: ChartBrief;
  href: string;
  creator?: boolean;
  original?: boolean;
  newTab?: boolean;
}
export function ChartListItem(props: CProps) {
  return (
    <li className="flex flex-row items-start w-full">
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
