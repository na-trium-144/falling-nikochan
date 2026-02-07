"use client";

import clsx from "clsx/lite";
import { useStandaloneDetector } from "./pwaInstall";
import Link from "next/link";
import EfferentThree from "@icon-park/react/lib/icons/EfferentThree";

interface Props {
  className?: string;
  noColor?: boolean;
  forceColor?: boolean;
  href?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}
function LinkChildren(props: Props) {
  return (
    <>
      {props.children}
      <EfferentThree className="inline-block text-sm align-middle mx-0.5" />
    </>
  );
}
export function ExternalLink(props: Props) {
  const isStandalone = useStandaloneDetector();
  if (props.onClick) {
    return (
      <button
        className={clsx("fn-link-1", props.className)}
        onClick={props.onClick}
      >
        <LinkChildren {...props} />
      </button>
    );
  } else if (props.href?.startsWith("/") && isStandalone) {
    return (
      <Link className={clsx("fn-link-1", props.className)} href={props.href}>
        <LinkChildren {...props} />
      </Link>
    );
  } else {
    return (
      <a
        className={clsx(
          props.href?.startsWith("/") && !props.forceColor
            ? "fn-link-1"
            : props.noColor
              ? "fn-link-2"
              : "fn-link-3",
          props.className
        )}
        href={props.href}
        target="_blank"
      >
        <LinkChildren {...props} />
      </a>
    );
  }
}
