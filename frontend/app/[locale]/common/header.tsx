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
        "p-3 w-full relative text-center text-xl font-semibold font-title main-wide:hidden",
        props.className
      )}
    >
      {!props.noBackButton && (
        <button
          className={clsx(pagerButtonClass, "absolute left-3 inset-y-3")}
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
