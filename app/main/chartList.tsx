import { ChartBrief } from "@/chartFormat/chart";
import { linkStyle1 } from "@/common/linkStyle";
import Link from "next/link";

interface CProps {
  cid: string;
  brief?: ChartBrief;
  href: string;
  creator?: boolean;
}
export function ChartListItem(props: CProps) {
  return (
    <li className="flex flex-row items-start w-full">
      <span className="flex-none mr-2">•</span>
      <Link href={props.href} className={"flex-1 min-w-0 " + linkStyle1}>
        <span className="inline-block">
          <span className="inline-block ">{props.cid}:</span>
          <span className="inline-block ml-2 font-title">
            {props.brief?.title}
          </span>
        </span>
        {props.creator && (
          <span className="inline-block ml-2 text-sm">
            <span className="">by</span>
            <span className="ml-1 font-title ">
              {props.brief?.chartCreator}
            </span>
          </span>
        )}
      </Link>
    </li>
  );
}
