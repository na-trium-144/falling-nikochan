"use client";

import { linkStyle1, linkStyle2, linkStyle3 } from "@/common/linkStyle.js";
import { EfferentThree } from "@icon-park/react";

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
