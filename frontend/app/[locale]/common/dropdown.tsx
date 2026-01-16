"use client";

import clsx from "clsx/lite";
import { ReactNode, useState, useRef, useEffect } from "react";
import { Box } from "./box";

export interface DropDownOption<T = unknown> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

interface Props<T = unknown> {
  children: ReactNode;
  options: DropDownOption<T>[];
  selectedValue?: T;
  onSelect: (value: T, index: number) => void;
  className?: string;
  disabled?: boolean;
}

export default function DropDown<T = unknown>(props: Props<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<"below" | "above">(
    "below"
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const findNextValidIndex = (
    currentIndex: number,
    direction: number
  ): number => {
    let next = currentIndex + direction;
    const length = props.options.length;

    while (next >= 0 && next < length) {
      if (!props.options[next].disabled) {
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
        setHighlightedIndex((prev) => findNextValidIndex(prev, 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) => findNextValidIndex(prev, -1));
      } else if (event.key === "Enter" && highlightedIndex >= 0) {
        event.preventDefault();
        const option = props.options[highlightedIndex];
        if (!option.disabled) {
          props.onSelect(option.value, highlightedIndex);
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
  }, [isOpen, highlightedIndex, props.options, props.onSelect]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isInBottomHalf = rect.bottom > viewportHeight / 2;
      setDropdownPosition(isInBottomHalf ? "above" : "below");
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (props.disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      const selectedIndex = props.options.findIndex(
        (opt) => opt.value === props.selectedValue
      );
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : -1);
    }
  };

  const handleOptionClick = (index: number) => {
    const option = props.options[index];
    if (option.disabled) return;
    props.onSelect(option.value, index);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className={clsx("inline-block relative", props.className)}
    >
      <div
        onClick={handleToggle}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        tabIndex={props.disabled ? -1 : 0}
      >
        {props.children}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={clsx(
            "absolute z-50 w-full min-w-max",
            dropdownPosition === "below" ? "mt-1" : "mb-1 bottom-full"
          )}
        >
          <Box
            classNameOuter="shadow-md"
            classNameInner="py-1"
          >
            <div role="listbox">
              {props.options.map((option, index) => {
                const isSelected = option.value === props.selectedValue;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={index}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    className={clsx(
                      "px-3 py-2 cursor-pointer",
                      "transition-colors duration-100",
                      option.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : isHighlighted || isSelected
                          ? "bg-blue-200/50 dark:bg-amber-900/50"
                          : "hover:bg-blue-100/30 dark:hover:bg-amber-800/30"
                    )}
                    onClick={() => handleOptionClick(index)}
                    onMouseEnter={() =>
                      !option.disabled && setHighlightedIndex(index)
                    }
                  >
                    {option.label}
                  </div>
                );
              })}
            </div>
          </Box>
        </div>
      )}
    </div>
  );
}
