"use client";

import clsx from "clsx/lite";
import Link from "next/link";
import { ButtonHighlight } from "./button";

interface Props {
  className?: string;
  index: number;
  maxIndex: number;
  title: string;
  hrefBefore?: string;
  onClickBefore?: () => void;
  hrefAfter?: string;
  onClickAfter?: () => void;
}
export function Pager(props: Props) {
  return (
    <div className={clsx("fn-pager", props.className)}>
      <div className="flex">
        {props.index > 1 ? (
          props.hrefBefore ? (
            <Link
              className="fn-icon-button fn-pager-arrow"
              href={props.hrefBefore}
              scroll={false}
              replace
              prefetch={process.env.PREFETCH as "auto"}
            >
              <ButtonHighlight />
              &lt;
            </Link>
          ) : (
            <button
              className="fn-icon-button fn-pager-arrow"
              onClick={props.onClickBefore}
            >
              <ButtonHighlight />
              &lt;
            </button>
          )
        ) : (
          <span className="w-7" />
        )}
        <span className="w-6 text-right">{props.index}</span>
        <span className="mx-2">/</span>
        <span className="w-6 text-left">{props.maxIndex}</span>
        {props.index < props.maxIndex ? (
          props.hrefAfter ? (
            <Link
              className="fn-icon-button fn-pager-arrow"
              href={props.hrefAfter}
              scroll={false}
              replace
              prefetch={process.env.PREFETCH as "auto"}
            >
              <ButtonHighlight />
              &gt;
            </Link>
          ) : (
            <button
              className="fn-icon-button fn-pager-arrow"
              onClick={props.onClickAfter}
            >
              <ButtonHighlight />
              &gt;
            </button>
          )
        ) : (
          <span className="w-7" />
        )}
      </div>
      <div className="flex-1 fn-heading-sect">{props.title}</div>
    </div>
  );
}
