"use client";

import { linkStyle1, linkStyle2, linkStyle3 } from "@/common/linkStyle.js";
import { useStandaloneDetector } from "./pwaInstall";
import Link from "next/link";
import EfferentThree from "@icon-park/react/lib/icons/EfferentThree";

interface Props {
  className?: string;
  noColor?: boolean;
  href?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}
function LinkChildren(props: Props) {
  return (
    <>
      {props.icon}
      <span className={"mr-4 " + (props.icon !== undefined && "ml-5")}>
        {props.children}
      </span>
      <EfferentThree className="absolute text-sm bottom-1 right-0" />
    </>
  );
}
export function ExternalLink(props: Props) {
  const isStandalone = useStandaloneDetector();
  if (props.onClick) {
    return (
      <button
        className={
          "relative inline-block w-max " + linkStyle1 + props.className
        }
        onClick={props.onClick}
      >
        <LinkChildren {...props} />
      </button>
    );
  } else if (props.href?.startsWith("/") && isStandalone) {
    return (
      <Link
        className={
          "relative inline-block w-max " + linkStyle1 + props.className
        }
        href={props.href}
      >
        <LinkChildren {...props} />
      </Link>
    );
  } else {
    return (
      <a
        className={
          "relative inline-block w-max " +
          (props.href?.startsWith("/")
            ? linkStyle1
            : props.noColor
              ? linkStyle2
              : linkStyle3) +
          props.className
        }
        href={props.href}
        target="_blank"
      >
        <LinkChildren {...props} />
      </a>
    );
  }
}
