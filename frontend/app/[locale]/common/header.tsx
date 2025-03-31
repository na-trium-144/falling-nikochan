"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { linkStyle1 } from "./linkStyle.js";
import { pagerButtonClass } from "./pager.js";
import { ArrowLeft } from "@icon-park/react";
import { useStandaloneDetector } from "./pwaInstall.js";

interface MProps {
  children: ReactNode | ReactNode[];
  noBackButton?: boolean;
}
export function MobileHeader(props: MProps) {
  return (
    <header
      className={"m-3 w-full relative text-center text-lg main-wide:hidden "}
    >
      {!props.noBackButton && (
        <button
          className={pagerButtonClass + "absolute left-0 inset-y-0 "}
          onClick={() => history.back()}
        >
          <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
        </button>
      )}
      {props.children}
    </header>
  );
}

interface Props {
  className?: string;
  children: ReactNode | ReactNode[];
  reload?: boolean;
  locale: string;
  backButton?: () => void;
}
export default function HeaderOld(props: Props) {
  const isStandalone = useStandaloneDetector();

  return (
    <div
      className={
        "p-3 w-full relative text-center main-wide:text-left " + props.className
      }
    >
      {props.backButton && (
        <button
          className={
            pagerButtonClass +
            "absolute left-3 inset-y-3 " +
            "main-wide:static main-wide:mr-4 align-bottom "
          }
          onClick={props.backButton}
        >
          <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
        </button>
      )}
      {props.reload && !isStandalone ? (
        <>
          <a
            href={`/${props.locale}`}
            className={"hidden main-wide:inline text-xl " + linkStyle1}
          >
            FallingNikochan
          </a>
          {!props.backButton && (
            <a
              href={`/${props.locale}`}
              className={
                pagerButtonClass +
                "absolute left-3 inset-y-3 " +
                "main-wide:hidden "
              }
            >
              <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
            </a>
          )}
        </>
      ) : (
        <>
          <Link
            href={`/${props.locale}`}
            className={"hidden main-wide:inline text-xl " + linkStyle1}
            prefetch={!process.env.NO_PREFETCH}
          >
            FallingNikochan
          </Link>
          {!props.backButton && (
            <Link
              href={`/${props.locale}`}
              className={
                pagerButtonClass +
                "absolute left-3 inset-y-3 " +
                "main-wide:hidden "
              }
              prefetch={!process.env.NO_PREFETCH}
            >
              <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
            </Link>
          )}
        </>
      )}
      <span className="ml-2 hidden main-wide:inline ">/</span>
      <span className="ml-2 flex-1 main-wide:flex-none inline-block text-lg main-wide:text-base ">
        {props.children}
      </span>
    </div>
  );
}
