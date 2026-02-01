"use client";

import clsx from "clsx/lite";
import { ReactNode } from "react";
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
          className="fn-back fn-pager-button"
          onClick={() => {
            historyBackWithReview();
          }}
        >
          <ArrowLeft className="inline-block w-max align-middle m-auto " />
        </button>
      )}
      <span className="fn-heading-sect">
        {props.children}
    </span>
    </header>
  );
}
