import clsx from "clsx/lite";
import { ReactNode, PointerEvent } from "react";
import { Key } from "./key.js";
import { SlimeSVG } from "./slime.js";
import { boxBorderStyle1, boxBorderStyle2 } from "./box.jsx";

export const buttonStyleDisabled = clsx(
  "appearance-none",
  "relative m-0.5 h-10 py-1.5 px-2.5 min-w-max text-center content-center cursor-default",
  "border border-blue-300/50 dark:border-amber-800/30 rounded-xl",
  "bg-slate-300/50 dark:bg-stone-700/50"
);
export const buttonShadowStyle = "shadow-slate-500/50 dark:shadow-stone-950/50";
export const buttonStyle = clsx(
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
        "inline-block align-bottom",
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
