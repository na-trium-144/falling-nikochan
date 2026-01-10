import clsx from "clsx/lite";
import { ReactNode, MouseEvent } from "react";

export const modalBg =
  "fixed inset-0 bg-slate-100/70 dark:bg-stone-900/50 z-20 ";

export const boxStyle = clsx(
  "bg-white/50 dark:bg-stone-700/50 backdrop-blur-xs",
  "inset-shadow-button inset-shadow-slate-300/25 dark:inset-shadow-stone-950/25"
);
export const boxBorderStyle1 = clsx(
  "absolute inset-0 z-2 rounded-[inherit] pointer-events-none",
  "border border-white/100 dark:border-stone-400/50",
  "mask-linear-160 mask-linear-from-black mask-linear-to-transparent mask-linear-to-50%"
);
export const boxBorderStyle2 = clsx(
  "absolute inset-0 z-1 rounded-[inherit] pointer-events-none",
  "border border-slate-300/80 dark:border-stone-900/30",
  "-mask-linear-20 mask-linear-from-black mask-linear-to-transparent mask-linear-to-100%"
);

interface Props {
  ref?: { current: HTMLDivElement | null };
  children: ReactNode | ReactNode[];
  hidden?: boolean;
  classNameOuter?: string;
  classNameInner?: string;
  classNameBorder?: string;
  styleOuter?: object;
  styleInner?: object;
  onClick?: (e: MouseEvent) => void;
  onPointerDown?: (e: MouseEvent) => void;
  onPointerUp?: (e: MouseEvent) => void;
}
export function Box(props: Props) {
  return (
    <div
      ref={props.ref}
      className={clsx(
        !props.classNameOuter?.includes("absolute") && "relative",
        "rounded-box",
        boxStyle,
        props.hidden && "hidden",
        props.classNameOuter
      )}
      style={props.styleOuter}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
    >
      <span className={clsx(boxBorderStyle1, props.classNameBorder)} />
      <span className={clsx(boxBorderStyle2, props.classNameBorder)} />
      <div
        className={clsx("w-full h-full", props.classNameInner)}
        style={props.styleInner}
      >
        {props.children}
      </div>
    </div>
  );
}

export function CenterBox(props: Props) {
  return (
    <Box
      ref={props.ref}
      classNameOuter={clsx(
        "absolute inset-0 m-auto w-max h-max max-w-full text-center z-20",
        props.hidden && "hidden",
        props.classNameOuter
      )}
      classNameInner={clsx("p-6", props.classNameInner)}
      styleOuter={props.styleOuter}
      styleInner={props.styleInner}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
    >
      {props.children}
    </Box>
  );
}

export function WarningBox(props: Props) {
  return (
    <div
      className={clsx(
        "text-center text-sm mx-6 my-2 px-3 py-2 h-max",
        "rounded-lg bg-amber-200/75 dark:bg-amber-800/75 backdrop-blur-2xs",
        props.hidden && "hidden"
      )}
      ref={props.ref}
      style={props.styleOuter}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
    >
      {props.children}
    </div>
  );
}
