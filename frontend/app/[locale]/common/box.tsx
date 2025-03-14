import { ReactNode, MouseEvent } from "react";

export const modalBg =
  "fixed inset-0 bg-slate-100/70 dark:bg-stone-900/50 z-20 ";

interface Props {
  ref?: { current: HTMLDivElement | null };
  children: ReactNode | ReactNode[];
  className?: string;
  style?: object;
  onClick?: (e: MouseEvent) => void;
}
export function Box(props: Props) {
  return (
    <div
      ref={props.ref}
      className={
        "rounded-lg bg-white/75 dark:bg-stone-800/75 " + (props.className || "")
      }
      style={{
        backdropFilter: "blur(2px)",
        ...props.style,
      }}
      onClick={props.onClick}
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
        (props.className || "")
      }
      style={props.style}
    >
      {props.children}
    </Box>
  );
}
