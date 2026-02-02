import clsx from "clsx/lite";
import { ReactNode, PointerEvent } from "react";
import { Key } from "./key.js";
import { SlimeSVG } from "./slime.js";

export function ButtonHighlight(props: { className?: string }) {
  return (
    <span
      className={clsx("fn-highlight", props.className)}
      onPointerMove={(e: PointerEvent) => {
        const button = e.currentTarget as HTMLButtonElement;
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
  return (
    <button
      className={clsx(
        "fn-button",
        props.loading && "cursor-wait",
        props.className,
        props.small && "h-8! py-0!"
      )}
      onClick={() => props.onClick && props.onClick()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      disabled={props.disabled || props.loading}
    >
      <span className="fn-glass-1" />
      <span className="fn-glass-2" />
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
      <span className="fn-glass-1" />
      <span className="fn-glass-2" />
      <ButtonHighlight />
      {props.children}
    </label>
  );
}
