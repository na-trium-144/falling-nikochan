"use client";

import { useEffect, useState } from "react";

// actualvalue: 実際の値 (フォーカスが外れたらこの値に戻る)
// updatevalue: 値を更新 isValidがtrueの場合にのみ呼ばれる
// isvalid: 値が有効かチェックする関数
interface Props {
  actualValue: string;
  updateValue: (v: string) => void;
  isValid: (v: string) => boolean;
}
export default function Input(props: Props) {
  const [value, setValue] = useState<string>("");
  const [focus, setFocus] = useState<boolean>(false);
  useEffect(() => {
    if (!focus) {
      setValue(props.actualValue);
    }
  }, [focus, props]);
  return (
    <input
      type="text"
      className={
        "mx-1 px-1 font-main-ui text-base text-right " +
        "border-0 border-b border-black bg-transparent " +
        (!props.isValid(value) ? "text-red-500 " : "")
      }
      value={value}
      onKeyDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        setValue(e.target.value);
        if (props.isValid(e.target.value)) {
          props.updateValue(e.target.value);
        }
      }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      size={6}
    />
  );
}
