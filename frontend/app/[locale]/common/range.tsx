"use client";

import clsx from "clsx/lite";
import { useState } from "react";
import { Range as ReactRange } from "react-range";

interface Props {
  className?: string;
  min: number;
  max: number;
  disabled?: boolean;
  value: number;
  onChange: (value: number) => void;
}
export default function Range(rangeProps: Props) {
  const [hovered, setHovered] = useState(false);
  // const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(false);
  return (
    <ReactRange
      step={1}
      min={rangeProps.min}
      max={rangeProps.max}
      values={[rangeProps.value]}
      onChange={(values) => rangeProps.onChange(values[0])}
      disabled={rangeProps.disabled}
      renderTrack={({ props, children }) => (
        <div
          {...props}
          className={clsx(
            "relative inline-block rounded-full h-2 w-40 my-2",
            "bg-slate-400/50 dark:bg-stone-600/50",
            rangeProps.className
          )}
        >
          <div
            className={clsx(
              "absolute inset-y-0 left-0 rounded-full -z-10",
              rangeProps.disabled
                ? "bg-transparent"
                : "bg-blue-400 dark:bg-amber-800"
            )}
            style={{ width: (rangeProps.value / rangeProps.max) * 100 + "%" }}
          />
          {children}
        </div>
      )}
      renderThumb={({ props }) => (
        <div
          {...props}
          key={props.key}
          className={clsx(
            "rounded-full w-5 h-5 shadow-sm",
            rangeProps.disabled
              ? "bg-slate-400 dark:bg-stone-600"
              : active
                ? "bg-blue-400 dark:bg-amber-800"
                : hovered
                  ? "bg-blue-200 dark:bg-amber-600"
                  : "bg-blue-300 dark:bg-amber-700"
          )}
          style={props.style}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => {
            setHovered(false);
            setActive(false);
          }}
          onPointerDown={() => setActive(true)}
          onPointerUp={() => setActive(false)}
        />
      )}
    />
  );
}
