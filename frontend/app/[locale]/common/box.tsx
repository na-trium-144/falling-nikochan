import { ReactNode, MouseEvent } from "react";

export const modalBg =
  "fixed inset-0 bg-slate-100/70 dark:bg-stone-900/50 z-20 ";

interface Props {
  ref?: { current: HTMLDivElement | null };
  children: ReactNode | ReactNode[];
  hidden?: boolean;
  className?: string;
  style?: object;
  onClick?: (e: MouseEvent) => void;
  onPointerDown?: (e: MouseEvent) => void;
  onPointerUp?: (e: MouseEvent) => void;
}
export function Box(props: Props) {
  return (
    <div
      ref={props.ref}
      className={
        "rounded-lg bg-white/75 dark:bg-stone-800/75 backdrop-blur-2xs " +
        (props.hidden ? "hidden " : "") +
        (props.className || "")
      }
      style={props.style}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
    >
      {props.children}
    </div>
  );
}

export function CenterBox(props: Props) {
  return (
    <Box
      ref={props.ref}
      className={
        "absolute inset-0 w-max max-w-full h-max m-auto p-6 text-center z-20 " +
        (props.hidden ? "hidden " : "") +
        (props.className || "")
      }
      style={props.style}
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
      className={
        "text-center text-sm mx-6 my-2 px-3 py-2 h-max " +
        "rounded-lg bg-amber-200/75 dark:bg-amber-800/75 backdrop-blur-2xs " +
        (props.hidden ? "hidden " : "")
      }
      ref={props.ref}
      style={props.style}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
    >
      {props.children}
    </div>
  );
}
