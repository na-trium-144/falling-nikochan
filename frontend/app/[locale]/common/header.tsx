"use client";

import clsx from "clsx/lite";
import { ReactNode } from "react";
import { pagerButtonClass } from "./pager.js";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import { historyBackWithReview } from "./pwaInstall.jsx";

interface MProps {
  className?: string;
  children: ReactNode | ReactNode[];
  noBackButton?: boolean;
}
export function MobileHeader(props: MProps) {
  return (
    <header
      className={clsx(
        "fn-mobile-header no-pc",
        props.className
      )}
    >
      {!props.noBackButton && (
        <button
          className="fn-back-button fn-pager-button"
          onClick={() => {
            historyBackWithReview();
          }}
        >
          <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
        </button>
      )}
      {props.children}
    </header>
  );
}
