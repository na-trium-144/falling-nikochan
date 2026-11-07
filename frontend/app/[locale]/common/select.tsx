"use client";

import clsx from "clsx/lite";
import Down from "@icon-park/react/lib/icons/Down";
import { ButtonHighlight } from "./button";
import DropDown, { DropDownProps } from "./dropdown";
import DownOne from "@icon-park/react/lib/icons/DownOne";

// Buttonと同じ見た目で矢印を追加したSelectの外観をしたDropDown。
// 使い方がselectである必要はなく、valueは必須でない
interface Props<T = unknown> extends DropDownProps<T> {
  showValue?: boolean;
}
export default function Select<T = unknown>(props: Props<T>) {
  return (
    <DropDown
      {...props}
      className={clsx("fn-button fn-select", props.className)}
    >
      <span className="fn-glass-1" />
      <span className="fn-glass-2" />
      <ButtonHighlight />
      <span className="fn-select">
        {props.showValue
          ? props.options.find((o) => o.value === props.value)?.label
          : props.children}
      </span>
      <Down className="fn-select-arrow" theme="filled" />
    </DropDown>
  );
}

export function SmallSelect<T = unknown>(
  props: Props<T> & { classNameInner?: string }
) {
  return (
    <DropDown
      {...props}
      className={clsx("fn-link-1 fn-input fn-small-select", props.className)}
    >
      <span className={clsx("fn-small-select-inner", props.classNameInner)}>
        {props.showValue
          ? props.options.find((o) => o.value === props.value)?.label
          : props.children}
      </span>
      <DownOne className="fn-small-select-arrow" theme="filled" />
    </DropDown>
  );
}
