"use client";

import { ReactNode } from "react";
import { pagerButtonClass } from "./pager.js";
import { ArrowLeft } from "@icon-park/react";

interface MProps {
  className?: string;
  children: ReactNode | ReactNode[];
  noBackButton?: boolean;
}
export function MobileHeader(props: MProps) {
  return (
    <header
      className={
        "p-3 w-full relative text-center text-lg main-wide:hidden " +
        props.className
      }
    >
      {!props.noBackButton && (
        <button
          className={pagerButtonClass + "absolute left-3 inset-y-3 "}
          onClick={() => history.back()}
        >
          <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
        </button>
      )}
      {props.children}
    </header>
  );
}
