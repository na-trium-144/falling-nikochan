"use client";

import clsx from "clsx/lite";
import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Box } from "./box";
import { ButtonHighlight } from "./button";
import { skyFlatButtonStyle } from "./flatButton";
import CheckSmall from "@icon-park/react/lib/icons/CheckSmall";
import { useDelayedDisplayState } from "./delayedDisplayState";

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
  className?: string;
  style?: object;
  disabled?: boolean;
}

export default function DropDown<T = unknown>(props: DropDownProps<T>) {
  const { options, onSelect } = props;
  const [isOpen, popupAppearing, setIsOpen] = useDelayedDisplayState(200);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  }>({ left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isInBottomHalf = rect.bottom > viewportHeight / 2;

      setDropdownPosition({
        [isInBottomHalf ? "bottom" : "top"]: isInBottomHalf
          ? viewportHeight - rect.top
          : rect.bottom,
        left: rect.left + rect.width / 2,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        dropdownRef.current &&
        event.target &&
        !containerRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
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
        setHighlightedIndex((prev) => (prev + 1) % options.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + options.length) % options.length
        );
      } else if (event.key === "Enter" && highlightedIndex >= 0) {
        event.preventDefault();
        onSelect(options[highlightedIndex].value, highlightedIndex);
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
  }, [isOpen, highlightedIndex, options, onSelect, setIsOpen]);

  const dropdownContent = (
    <Box
      refOuter={dropdownRef}
      styleOuter={{
        ...dropdownPosition,
        minWidth: "max-content",
      }}
      classNameOuter={clsx(
        "fn-dropdown fixed -translate-x-1/2",
        "transition-[scale,opacity] duration-150",
        popupAppearing
          ? "ease-in scale-100 opacity-100"
          : "ease-out scale-0 opacity-0",
        dropdownPosition.top !== undefined
          ? "mt-1 origin-top"
          : "mb-1 origin-bottom"
      )}
      onPointerLeave={() => setHighlightedIndex(-1)}
    >
      {options.map((option, index) => (
        <button
          key={index}
          className={clsx(
            "fn-flat-button fn-sky fn-dropdown-item",
            highlightedIndex === index && "fn-selected",
            option.className
          )}
          style={option.style}
          onClick={() => {
            onSelect(option.value, index);
            setIsOpen(false);
            setHighlightedIndex(-1);
          }}
          onPointerEnter={() => setHighlightedIndex(index)}
        >
          <ButtonHighlight />
          {option.value === props.value ? (
            <CheckSmall className="fn-check h-max m-auto" />
          ) : props.value !== undefined ? (
            <span className="fn-check" />
          ) : null}
          {option.label}
        </button>
      ))}
    </Box>
  );

  return (
    <>
      <button
        ref={containerRef}
        className={clsx("relative cursor-pointer", props.className)}
        style={props.style}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={props.disabled}
      >
        {props.children}
      </button>
      {typeof document !== "undefined" &&
        isMounted &&
        isOpen &&
        createPortal(dropdownContent, document.body)}
    </>
  );
}
