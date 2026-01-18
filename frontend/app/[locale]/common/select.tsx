"use client";

import clsx from "clsx/lite";
import Down from "@icon-park/react/lib/icons/Down";
import {
  ButtonHighlight,
} from "./button";
import DropDown, { DropDownProps } from "./dropdown";

// Buttonと同じ見た目で矢印を追加したSelectの外観をしたDropDown。
// 使い方がselectである必要はなく、valueは必須でない
interface Props<T = unknown> extends DropDownProps<T> {
  showValue?: boolean;
}
export default function Select<T = unknown>(props: Props<T>) {
  return (
    <DropDown
      {...props}
      className={clsx(
        props.disabled ? "fn-button-disabled" : "fn-button",
        "pr-6",
        props.className
      )}
    >
      {!props.disabled && (
        <>
          <span className="fn-glass-1" />
          <span className="fn-glass-2" />
          <ButtonHighlight />
        </>
      )}
      <span className="relative flex flex-row items-center justify-center">
        {props.showValue
          ? props.options.find((o) => o.value === props.value)?.label
          : props.children}
      </span>
      <Down
        className="absolute inset-y-0 my-auto h-max right-2 pointer-events-none"
        theme="filled"
      />
    </DropDown>
  );
}
