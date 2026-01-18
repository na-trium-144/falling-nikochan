"use client";

import clsx from "clsx/lite";
import { useEffect, useState, RefObject } from "react";

// actualvalue: 実際の値 (フォーカスが外れたらこの値に戻る)
// updatevalue: 値を更新 isValidがtrueの場合にのみ呼ばれる
// updateinvalidvalue: isValidがfalseだった場合呼ばれる
// isvalid: 値が有効かチェックする関数
interface Props {
  ref?: RefObject<HTMLInputElement | null>;
  actualValue: string;
  updateValue: (v: string) => void;
  updateInvalidValue?: (v: string) => void;
  isValid?: (v: string) => boolean;
  left?: boolean;
  right?: boolean;
  className?: string;
  passwd?: boolean;
  disabled?: boolean;
  onEnter?: (v: string) => void; // これが呼ばれた時点では値がまだ外側のstateに反映されていない場合がある
}
export default function Input(props: Props) {
  const [value, setValue] = useState<string>(props.actualValue);
  const [focus, setFocus] = useState<boolean>(false);
  const [valueSetTimer, setValueSetTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  useEffect(() => {
    if (!focus && valueSetTimer === null) {
      setValue(props.actualValue);
    }
  }, [focus, props, valueSetTimer]);

  return (
    <input
      ref={props.ref}
      type={props.passwd ? "password" : "text"}
      className={clsx(
        "font-main-ui text-base",
        !props.left && "text-right",
        inputStyle,
        props.isValid && !props.isValid(value) && "text-red-500",
        props.disabled &&
          "text-slate-400 border-slate-200 dark:text-stone-600 dark:border-stone-700",
        props.className
      )}
      value={value}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (
          e.key === "Enter" &&
          props.onEnter &&
          (!props.isValid || props.isValid(value))
        ) {
          if (valueSetTimer !== null) {
            clearTimeout(valueSetTimer);
          }
          setValueSetTimer(null);
          props.updateValue(value);
          props.onEnter(value);
        }
      }}
      onKeyUp={(e) => e.stopPropagation()}
      onChange={(e) => {
        setValue(e.target.value);
        if (valueSetTimer !== null) {
          clearTimeout(valueSetTimer);
        }
        // iOSで日本語入力時にonChangeが複数回呼ばれてluaExecがうまく動作しないので、
        // 値の更新を遅延させる
        setValueSetTimer(
          setTimeout(() => {
            if (!props.isValid || props.isValid(e.target.value)) {
              props.updateValue(e.target.value);
            } else if (props.updateInvalidValue) {
              props.updateInvalidValue(e.target.value);
            }
            setValueSetTimer(null);
          }, 250)
        );
      }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      disabled={props.disabled}
    />
  );
}
