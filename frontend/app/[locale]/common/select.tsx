"use client";

import clsx from "clsx/lite";
import Down from "@icon-park/react/lib/icons/Down";
import { ReactNode } from "react";
import {
  buttonStyle,
  buttonStyleDisabled,
  buttonBorderStyle1,
  buttonBorderStyle2,
  ButtonHighlight,
} from "./button";
import DropDown, { DropDownOption } from "./dropdown";

interface Props {
  options: (string | ReactNode)[];
  values: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  disableFirstOption?: boolean;
  classNameOuter?: string;
  classNameInner?: string;
}

export default function Select(props: Props) {
  const currentIndex = props.values.indexOf(props.value);
  const currentOption = props.options[currentIndex] ?? props.options[0];

  const dropdownOptions: DropDownOption<string>[] = props.options.map(
    (option, index) => ({
      value: props.values[index],
      label: option,
      disabled: props.disableFirstOption && index === 0,
    })
  );

  return (
    <DropDown
      className={props.classNameOuter}
      options={dropdownOptions}
      selectedValue={props.value}
      onSelect={(value) => props.onChange(value)}
      disabled={props.disabled}
    >
      <button
        type="button"
        className={clsx(
          props.disabled ? buttonStyleDisabled : buttonStyle,
          "pr-8",
          props.classNameInner
        )}
        disabled={props.disabled}
      >
        {!props.disabled && (
          <>
            <span className={buttonBorderStyle1} />
            <span className={buttonBorderStyle2} />
            <ButtonHighlight />
          </>
        )}
        <span className="relative z-10">{currentOption}</span>
        <Down
          className="absolute inset-y-0 my-auto h-max right-2 z-10 pointer-events-none"
          theme="filled"
        />
      </button>
    </DropDown>
  );
}
