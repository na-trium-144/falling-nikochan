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
        <div
          {...props}
          key={props.key}
          className={clsx(
            "fn-range-thumb",
            hovered && "fn-r-hover",
            active && "fn-r-active",
            rangeProps.disabled && "fn-r-disabled"
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
