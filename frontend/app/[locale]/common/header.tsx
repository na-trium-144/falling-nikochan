"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { linkStyle1 } from "./linkStyle.js";
import { pagerButtonClass } from "./pager.js";
import { ArrowLeft } from "@icon-park/react";
import { useStandaloneDetector } from "./pwaInstall.js";

interface Props {
  className?: string;
  children: ReactNode | ReactNode[];
  reload?: boolean;
  locale: string;
  backButton?: () => void;
}
export default function Header(props: Props) {
  const isStandalone = useStandaloneDetector();

  return (
    <div className={"p-3 pb-0 w-full " + props.className}>
      {props.backButton && (
        <button
          className={pagerButtonClass + "mr-4 align-bottom "}
          onClick={props.backButton}
        >
          <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
        </button>
      )}
      {props.reload && !isStandalone ? (
        <a href={`/${props.locale}`} className={"text-xl " + linkStyle1}>
          FallingNikochan
        </a>
      ) : (
        <Link
          href={`/${props.locale}`}
          className={"text-xl " + linkStyle1}
          prefetch={!process.env.NO_PREFETCH}
        >
          FallingNikochan
        </Link>
      )}
      <span className="ml-2">/</span>
      <span className="ml-2 inline-block">{props.children}</span>
    </div>
  );
}
