"use client";

import clsx from "clsx/lite";
import { ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { Key } from "./key.js";
import { SlimeSVG } from "./slime.js";

function buttonHighlightHandler(e: PointerEvent) {
  const button = e.currentTarget as HTMLElement;
  const rect = button.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  button.style.setProperty("--hl-x", `${x}px`);
  button.style.setProperty("--hl-y", `${y}px`);
}
export function ButtonHighlight(props: { className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const parent = ref.current?.parentElement;
    parent?.addEventListener("pointermove", buttonHighlightHandler);
    return () =>
      parent?.removeEventListener("pointermove", buttonHighlightHandler);
  }, []);
  return <fn-highlight ref={ref} className={clsx(props.className)} />;
}

const ButtonKeyDisablerContext = createContext<boolean>(false);
export function ButtonKeyDisabler(props: { children: ReactNode }) {
  return (
    <ButtonKeyDisablerContext.Provider value={true}>
      {props.children}
    </ButtonKeyDisablerContext.Provider>
  );
}

interface Props {
  className?: string;
  onClick?: () => void;
  text?: string;
  children?: ReactNode;
  keyName?: string | string[];
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
}
export default function Button(props: Props) {
  const buttonKeyDisabled = useContext(ButtonKeyDisablerContext);
  return (
    <button
      className={clsx(
        "fn-button",
        props.small && "fn-small",
        props.loading && "cursor-wait",
        props.className
      )}
      onClick={() => props.onClick && props.onClick()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (buttonKeyDisabled) {
          e.preventDefault();
        } else {
          e.stopPropagation();
        }
      }}
      onKeyUp={(e) => {
        if (buttonKeyDisabled) {
          e.preventDefault();
        } else {
          e.stopPropagation();
        }
      }}
      disabled={props.disabled || props.loading}
    >
      <fn-glass-1 />
      <fn-glass-2 />
      <ButtonHighlight />
      {props.loading && <SlimeSVG />}
      <span
        className={clsx(
          props.keyName && (props.text ?? props.children) && "mr-1"
        )}
      >
        {props.text ?? props.children}
      </span>
      {Array.isArray(props.keyName)
        ? props.keyName.map((k, i) => (
            <>
              {i > 0 && <span className="">+</span>}
              <Key key={i} handleKeyDown>
                {k}
              </Key>
            </>
          ))
        : props.keyName && <Key handleKeyDown>{props.keyName}</Key>}
    </button>
  );
}

interface LabelProps {
  className?: string;
  children?: ReactNode;
  htmlFor?: string;
}
export function ButtonStyledLabel(props: LabelProps) {
  return (
    <label
      className={clsx(
        "fn-button",
        "inline-flex items-center align-bottom",
        props.className
      )}
      htmlFor={props.htmlFor}
    >
      <fn-glass-1 />
      <fn-glass-2 />
      <ButtonHighlight />
      {props.children}
    </label>
  );
}
