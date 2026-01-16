"use client";

import clsx from "clsx/lite";
import { ReactNode, useState, useRef, useEffect } from "react";
import { Box } from "./box";
import { ButtonHighlight } from "./button";
import { skyFlatButtonStyle } from "./flatButton";
import CheckSmall from "@icon-park/react/lib/icons/CheckSmall";

export interface DropDownOption<T> {
  value: T;
  className?: string;
  style?: object;
  label: ReactNode;
}

export interface DropDownProps<T> {
  children?: ReactNode;
  options: DropDownOption<T>[];
  value?: T;
  onSelect: (value: T, index: number) => void;
  classNameOuter?: string;
  classNameInner?: string;
  styleOuter?: object;
  styleInner?: object;
  disabled?: boolean;
}

export default function DropDown<T = unknown>(props: DropDownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<"below" | "above">(
    "below"
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target &&
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
        setHighlightedIndex((prev) => (prev + 1) % props.options.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + props.options.length) % props.options.length
        );
      } else if (event.key === "Enter" && highlightedIndex >= 0) {
        event.preventDefault();
        props.onSelect(props.options[highlightedIndex].value, highlightedIndex);
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, highlightedIndex, props.options, props.onSelect]);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isInBottomHalf = rect.bottom > viewportHeight / 2;
      setDropdownPosition(isInBottomHalf ? "above" : "below");
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={clsx("inline-block relative", props.classNameOuter)}
      style={props.styleOuter}
    >
      <button
        className={clsx("cursor-pointer", props.classNameInner)}
        style={props.styleInner}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {props.children}
      </button>

      {isOpen && (
        <Box
          classNameOuter={clsx(
            "absolute! z-50 w-full min-w-max shadow-modal overflow-hidden",
            dropdownPosition === "below" ? "mt-1" : "mb-1 bottom-full"
          )}
          classNameInner={clsx("flex flex-col")}
          onPointerLeave={() => setHighlightedIndex(-1)}
        >
          {props.options.map((option, index) => (
            <button
              key={index}
              className={clsx(
                "relative cursor-pointer group",
                skyFlatButtonStyle,
                "hover:bg-sky-200/75! hover:dark:bg-orange-950/75!",
                highlightedIndex === index &&
                  "bg-sky-200/75 dark:bg-orange-950/75",
                props.value !== undefined ? "pl-7" : "pl-4",
                "pr-4 py-1 flex flex-row items-center justify-center",
                option.className
              )}
              style={option.style}
              onClick={() => {
                props.onSelect(option.value, index);
                setIsOpen(false);
                setHighlightedIndex(-1);
              }}
              onPointerEnter={() => setHighlightedIndex(index)}
            >
              <ButtonHighlight />
              {option.value === props.value ? (
                <CheckSmall className="absolute left-2 inset-y-0 h-max m-auto" />
              ) : props.value !== undefined ? (
                <span className="absolute left-2 inset-y-0 h-max m-auto" />
              ) : null}
              {option.label}
            </button>
          ))}
        </Box>
      )}
    </div>
  );
}
