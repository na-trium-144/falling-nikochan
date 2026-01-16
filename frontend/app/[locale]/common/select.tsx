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
import DropDown from "./dropdown";
import CheckSmall from "@icon-park/react/lib/icons/CheckSmall";

interface Props {
  options: ReactNode[];
  values: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  classNameOuter?: string;
  classNameInner?: string;
}

export default function Select(props: Props) {
  const currentIndex = props.values.indexOf(props.value);
  const currentOption = props.options[currentIndex] ?? props.options[0];

  return (
    <DropDown
      classNameOuter={props.classNameOuter}
      options={props.options.map((option, index) => ({
        value: props.values[index],
        className: "pl-2 pr-4 py-1 flex flex-row items-center justify-center",
        label: (
          <>
            {index === currentIndex ? (
              <CheckSmall className="w-5" />
            ) : (
              <span className="w-5" />
            )}
            <span className="flex-1 text-center">{option}</span>
          </>
        ),
      }))}
      onSelect={(value) => props.onChange(value)}
      disabled={props.disabled}
      classNameInner={clsx(
        props.disabled ? buttonStyleDisabled : buttonStyle,
        "pr-6",
        props.classNameInner
      )}
    >
      {!props.disabled && (
        <>
          <span className={buttonBorderStyle1} />
          <span className={buttonBorderStyle2} />
          <ButtonHighlight />
        </>
      )}
      <span className="relative flex flex-row items-center justify-center">
        {currentOption}
      </span>
      <Down
        className="absolute inset-y-0 my-auto h-max right-2 pointer-events-none"
        theme="filled"
      />
    </DropDown>
  );
}
