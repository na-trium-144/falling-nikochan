"use client";

import clsx from "clsx/lite";
import { useState } from "react";
import { Range as ReactRange } from "react-range";
import { IThumbProps } from "react-range/lib/types";

interface Props {
  className?: string;
  min: number;
  max: number;
  disabled?: boolean;
  value: number;
  onChange: (value: number) => void;
}
export default function Range(rangeProps: Props) {
  return (
    <ReactRange
      step={1}
      min={rangeProps.min}
      max={Math.max(rangeProps.max, rangeProps.min + 1)}
      values={[rangeProps.value]}
      onChange={(values) => rangeProps.onChange(values[0])}
      disabled={rangeProps.disabled || rangeProps.min >= rangeProps.max}
      renderTrack={({ props, children }) => (
        <div {...props} className={clsx("fn-range", rangeProps.className)}>
          <div className="fn-range-bg">
            <div
              className={clsx("fn-range-fill", rangeProps.disabled && "hidden")}
              style={{
                width:
                  ((rangeProps.value - rangeProps.min) /
                    (rangeProps.max - rangeProps.min)) *
                    100 +
                  "%",
              }}
            />
          </div>
          {children}
        </div>
      )}
      renderThumb={({ props }) => (
        <RenderThumb
          {...props}
          key={props.key}
          disabled={rangeProps.disabled}
        />
      )}
    />
  );
}

function RenderThumb(props: IThumbProps & { disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);
  // const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(false);
  return (
    <div
      {...props}
      className={clsx(
        "fn-range-thumb",
        hovered && "fn-r-hover",
        active && "fn-r-active",
        props.disabled && "fn-r-disabled"
      )}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setActive(false);
      }}
      onPointerDown={() => setActive(true)}
      onPointerUp={() => setActive(false)}
    />
  );
}

interface Props2 {
  className?: string;
  min: number;
  max: number;
  disabled?: boolean;
  value1: number;
  value2: number;
  onChange: (value1: number, value2: number) => void;
}
export function Range2(rangeProps: Props2) {
  return (
    <ReactRange
      step={1}
      min={rangeProps.min}
      max={Math.max(rangeProps.max, rangeProps.min + 1)}
      values={[rangeProps.value1, rangeProps.value2]}
      onChange={(values) => rangeProps.onChange(values[0], values[1])}
      disabled={rangeProps.disabled || rangeProps.min >= rangeProps.max}
      renderTrack={({ props, children }) => (
        <div {...props} className={clsx("fn-range", rangeProps.className)}>
          <div className="fn-range-bg">
            <div
              className={clsx("fn-range-fill", rangeProps.disabled && "hidden")}
              style={{
                left:
                  ((rangeProps.value1 - rangeProps.min) /
                    (rangeProps.max - rangeProps.min)) *
                    100 +
                  "%",
                width:
                  ((rangeProps.value2 - rangeProps.value1) /
                    (rangeProps.max - rangeProps.min)) *
                    100 +
                  "%",
              }}
            />
          </div>
          {children}
        </div>
      )}
      renderThumb={({ props }) => (
        <RenderThumb
          {...props}
          key={props.key}
          disabled={rangeProps.disabled}
        />
      )}
    />
  );
}
