"use client";

import clsx from "clsx/lite";
import { useInsideFrameDetector, useStandaloneDetector } from "./pwaInstall";
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
function isExternalLink(href: string) {
  return !href.startsWith("/") || href.startsWith("/api");
}
export function ExternalLink(props: Props) {
  const isStandalone = useStandaloneDetector();
  const isInsideFrame = useInsideFrameDetector();
  if (props.onClick) {
    return (
      <button
        className={clsx("fn-link-1", props.className)}
        onClick={props.onClick}
      >
        <LinkChildren {...props} />
      </button>
    );
  } else if (
    props.href &&
    !isExternalLink(props.href) &&
    (isStandalone || isInsideFrame)
  ) {
    return (
      <Link
        className={clsx("fn-link-1", props.className)}
        href={props.href}
        prefetch={process.env.PREFETCH as "auto"}
      >
        <LinkChildren {...props} />
      </Link>
    );
  } else {
    // 実際にhrefもonClickも渡されないExternalLinkは存在し(トップページのメールアドレス)、それはExternalとして扱う
    return (
      <a
        className={clsx(
          props.href && !isExternalLink(props.href) && !props.forceColor
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
