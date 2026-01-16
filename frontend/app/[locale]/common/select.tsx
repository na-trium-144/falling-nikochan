"use client";

import clsx from "clsx/lite";
import Down from "@icon-park/react/lib/icons/Down";
import { useState, useRef, useEffect, PointerEvent } from "react";
import { boxBorderStyle1, boxBorderStyle2 } from "./box";

const buttonStyleDisabled = clsx(
  "appearance-none",
  "relative m-0.5 h-10 py-1.5 px-2.5 min-w-max text-center content-center cursor-default",
  "border border-blue-300/50 dark:border-amber-800/30 rounded-xl",
  "bg-slate-300/50 dark:bg-stone-700/50"
);
const buttonShadowStyle = "shadow-slate-500/50 dark:shadow-stone-950/50";
const buttonStyle = clsx(
  "appearance-none",
  "relative m-0.5 h-10 py-1.5 px-2.5 min-w-max text-center content-center cursor-pointer",
  "rounded-xl",
  "group",
  "bg-blue-50/75 bg-gradient-to-t from-blue-200/75 to-blue-50/75",
  "active:bg-blue-200/75 active:from-blue-200/75 active:to-blue-200/75",
  "dark:bg-amber-800/75 dark:from-amber-950/75 dark:to-amber-800/75",
  "active:dark:bg-amber-950/75 active:dark:from-amber-950/75 active:dark:to-amber-950/75",
  "active:inset-shadow-button inset-shadow-blue-400/50 dark:inset-shadow-amber-975/75",
  "shadow-sm",
  buttonShadowStyle
);
const buttonBorderStyle1 = clsx(
  boxBorderStyle1,
  "border-white/80! dark:border-stone-300/50!",
  "mask-linear-to-75%!",
  "opacity-100 group-active:opacity-0"
);
const buttonBorderStyle2 = clsx(
  boxBorderStyle2,
  "border-blue-300/80! dark:border-amber-800/50!",
  "mask-linear-to-75%!",
  "group-active:mask-none!"
);

function ButtonHighlight(props: { className?: string }) {
  return (
    <span
      className={clsx(
        "absolute inset-0 z-3 rounded-[inherit]",
        "bg-radial-[circle_3rem_at_var(--hl-x)_var(--hl-y)]",
        "from-white/50 to-white/25",
        "dark:from-stone-300/20 dark:to-stone-300/10",
        "opacity-0 group-hover:opacity-100 group-active:opacity-25",
        "transition-opacity duration-100",
        props.className
      )}
      onPointerMove={(e: PointerEvent) => {
        const button = e.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        button.style.setProperty("--hl-x", `${x}px`);
        button.style.setProperty("--hl-y", `${y}px`);
      }}
    />
  );
}

interface Props {
  options: string[];
  values: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  disableFirstOption?: boolean;
  classNameOuter?: string;
  classNameInner?: string;
}

export default function Select(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = props.values.indexOf(props.value);
  const currentOption = props.options[currentIndex] ?? props.options[0];

  const findNextValidIndex = (
    currentIndex: number,
    direction: number,
    disableFirstOption: boolean
  ): number => {
    let next = currentIndex + direction;
    const length = props.options.length;

    while (next >= 0 && next < length) {
      if (!(disableFirstOption && next === 0)) {
        return next;
      }
      next += direction;
    }
    return currentIndex;
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setHighlightedIndex(-1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          findNextValidIndex(prev, 1, props.disableFirstOption ?? false)
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          findNextValidIndex(prev, -1, props.disableFirstOption ?? false)
        );
      } else if (event.key === "Enter" && highlightedIndex >= 0) {
        event.preventDefault();
        if (!(props.disableFirstOption && highlightedIndex === 0)) {
          props.onChange(props.values[highlightedIndex]);
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isOpen,
    highlightedIndex,
    props.disableFirstOption,
    props.onChange,
    props.values,
    props.options,
  ]);

  const handleToggle = () => {
    if (props.disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightedIndex(currentIndex);
    }
  };

  const handleOptionClick = (index: number) => {
    if (props.disableFirstOption && index === 0) return;
    props.onChange(props.values[index]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className={clsx("inline-block relative", props.classNameOuter)}
    >
      <button
        type="button"
        className={clsx(
          props.disabled ? buttonStyleDisabled : buttonStyle,
          "pr-8",
          props.classNameInner
        )}
        onClick={handleToggle}
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
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

      {isOpen && (
        <div
          role="listbox"
          className={clsx(
            "absolute z-50 mt-1 w-full min-w-max",
            "rounded-xl overflow-hidden",
            "bg-blue-50/95 dark:bg-amber-800/95",
            "border border-blue-300/80 dark:border-amber-800/50",
            "shadow-lg",
            buttonShadowStyle
          )}
        >
          {props.options.map((option, index) => {
            const isDisabled = props.disableFirstOption && index === 0;
            const isSelected = index === currentIndex;
            const isHighlighted = index === highlightedIndex;

            return (
              <div
                key={index}
                role="option"
                aria-selected={isSelected}
                aria-disabled={isDisabled}
                className={clsx(
                  "px-3 py-2 cursor-pointer",
                  "transition-colors duration-100",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : isHighlighted || isSelected
                      ? "bg-blue-200/75 dark:bg-amber-950/75"
                      : "hover:bg-blue-100/50 dark:hover:bg-amber-900/50"
                )}
                onClick={() => handleOptionClick(index)}
                onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
              >
                {option}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
