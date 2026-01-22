import clsx from "clsx/lite";
import { ReactNode, MouseEvent } from "react";
import { Scrollable } from "./scrollable";

export const modalBg =
  "fixed inset-0 grid place-content-center place-items-center grid-rows-1 grid-cols-1 bg-slate-100/70 dark:bg-stone-900/50 z-20 ";

export const boxStyle = clsx(
  "bg-white/50 dark:bg-stone-700/50 backdrop-blur-xs",
  "inset-shadow-button inset-shadow-slate-300/25 dark:inset-shadow-stone-950/25"
);
export const boxBorderStyle1 = clsx(
  "absolute inset-0 z-2 rounded-[inherit] sq-inherit pointer-events-none",
  "border border-white/100 dark:border-stone-400/50",
  "mask-linear-160 mask-linear-from-black mask-linear-to-transparent mask-linear-to-50%"
);
export const boxBorderStyle2 = clsx(
  "absolute inset-0 z-1 rounded-[inherit] sq-inherit pointer-events-none",
  "border border-slate-300/80 dark:border-stone-900/30",
  "-mask-linear-20 mask-linear-from-black mask-linear-to-transparent mask-linear-to-100%"
);
export const warningBoxBorderStyle1 = clsx(
  boxBorderStyle1,
  "border-white/80! dark:border-stone-300/50!"
);
export const warningBoxBorderStyle2 = clsx(
  boxBorderStyle2,
  "border-amber-600/25!"
);

interface Props {
  refOuter?: { current: HTMLDivElement | null };
  refInner?: { current: HTMLDivElement | null };
  scrollableX?: boolean;
  scrollableY?: boolean;
  padding?: number; // * spacing
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
  onPointerLeave?: (e: MouseEvent) => void;
}
export function Box(props: Props) {
  return (
    <div
      ref={props.refOuter}
      className={clsx(
        /*
        外側のabsolute要素の中央に揃えたい場合、 absolute inset-0 m-auto を使うとsafariでバグる。
        外側の要素を
          grid place-content-center place-items-center grid-rows-1 grid-cols-1
        にしておきBoxには何も指定しないようにするとうまくいく

        width, height, max-width, max-height はclassNameOuterに指定すること。
        内側の要素のサイズはgridとw-full,h-full指定により外側と同じになる (たぶん)
        */
        "relative",
        "rounded-sq-box",
        "grid grid-cols-1 grid-rows-1",
        "overflow-hidden",
        boxStyle,
        props.hidden && "hidden",
        props.classNameOuter
      )}
      style={props.styleOuter}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
      onPointerLeave={props.onPointerLeave}
    >
      <span className={clsx(boxBorderStyle1, props.classNameBorder)} />
      <span className={clsx(boxBorderStyle2, props.classNameBorder)} />
      {props.scrollableX || props.scrollableY ? (
        <Scrollable
          ref={props.refInner}
          className={clsx(
            "w-full h-full",
            "overflow-hidden",
            props.classNameInner
          )}
          style={props.styleInner}
          padding={props.padding ?? 0}
          scrollableX={props.scrollableX}
          scrollableY={props.scrollableY}
        >
          {props.children}
        </Scrollable>
      ) : (
        <div
          ref={props.refInner}
          className={clsx("w-full h-full", props.classNameInner)}
          style={{
            ...props.styleInner,
            padding: props.padding
              ? `calc(var(--spacing) * ${props.padding})`
              : undefined,
          }}
        >
          {props.children}
        </div>
      )}
    </div>
  );
}

export function CenterBox(props: Props) {
  return (
    <div
      ref={props.refOuter}
      className={clsx(
        "absolute inset-0 grid place-content-center place-items-center grid-rows-1 grid-cols-1",
        "pointer-events-none",
        props.classNameOuter,
        props.hidden && "hidden"
      )}
    >
      <Box
        refInner={props.refInner}
        classNameOuter={clsx(
          "w-max h-max max-w-full text-center",
          "pointer-events-auto"
        )}
        classNameInner={clsx(props.classNameInner)}
        styleOuter={props.styleOuter}
        styleInner={props.styleInner}
        scrollableX={props.scrollableX}
        scrollableY={props.scrollableY}
        padding={props.padding ?? 6}
        onClick={props.onClick}
        onPointerDown={props.onPointerDown}
        onPointerUp={props.onPointerUp}
      >
        {props.children}
      </Box>
    </div>
  );
}

export function WarningBox(props: Props) {
  return (
    <div
      className={clsx(
        "relative",
        "text-center text-sm mx-6 my-2 p-3 h-max",
        "rounded-sq-2xl bg-amber-400/25 backdrop-blur-xs",
        "inset-shadow-button inset-shadow-amber-800/10",
        props.hidden && "hidden"
      )}
      ref={props.refOuter}
      style={props.styleOuter}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
    >
      <span className={clsx(warningBoxBorderStyle1, props.classNameBorder)} />
      <span className={clsx(warningBoxBorderStyle2, props.classNameBorder)} />
      {props.children}
    </div>
  );
}
