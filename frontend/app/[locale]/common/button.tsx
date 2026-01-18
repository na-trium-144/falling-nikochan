import clsx from "clsx/lite";
import { ReactNode, PointerEvent } from "react";
import { Key } from "./key.js";
import { SlimeSVG } from "./slime.js";
import { boxBorderStyle1, boxBorderStyle2 } from "./box.jsx";

// Export CSS class names for compatibility
export const buttonStyle = "fn-button-style group";
export const buttonStyleDisabled = "fn-button-style-disabled";

// These class strings are kept for dynamic composition in flatButton.tsx
export const buttonShadowStyle = "shadow-slate-500/50 dark:shadow-stone-950/50";
export const buttonBorderStyle1 = clsx(
  boxBorderStyle1,
  "border-white/80! dark:border-stone-300/50!",
  "mask-linear-to-75%!",
  "opacity-100 group-active:opacity-0"
);
export const buttonBorderStyle2 = clsx(
  boxBorderStyle2,
  "border-blue-300/80! dark:border-amber-800/50!",
  "mask-linear-to-75%!",
  "group-active:mask-none!"
);
export function ButtonHighlight(props: { className?: string }) {
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
}
export default function Button(props: Props) {
  return (
    <button
      className={clsx(
        props.disabled || props.loading ? buttonStyleDisabled : buttonStyle,
        props.loading && "cursor-wait",
        props.className
      )}
      onClick={() => props.onClick && props.onClick()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      disabled={props.disabled || props.loading}
    >
      {props.disabled || props.loading ? null : (
        <>
          <span className={buttonBorderStyle1} />
          <span className={buttonBorderStyle2} />
          <ButtonHighlight />
        </>
      )}
      {props.loading && <SlimeSVG />}
      <span className={clsx(props.keyName && "mr-1")}>
        {props.text ?? props.children}
      </span>
      {Array.isArray(props.keyName)
        ? props.keyName.map((k, i) => (
            <>
              {i > 0 && <span className="">+</span>}
              <Key key={i} className="text-xs p-0.5 ">
                {k}
              </Key>
            </>
          ))
        : props.keyName && (
            <Key className="text-xs p-0.5 ">{props.keyName}</Key>
          )}
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
        buttonStyle,
        "inline-flex items-center align-bottom",
        props.className
      )}
      htmlFor={props.htmlFor}
    >
      <span className={buttonBorderStyle1} />
      <span className={buttonBorderStyle2} />
      <ButtonHighlight />
      {props.children}
    </label>
  );
}
