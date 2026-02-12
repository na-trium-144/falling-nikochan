import clsx from "clsx/lite";
import { ReactNode, MouseEvent } from "react";
import { Scrollable } from "./scrollable";

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
        "fn-box",
        "fn-plain",
        props.hidden && "hidden",
        props.classNameOuter
      )}
      style={props.styleOuter}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
      onPointerLeave={props.onPointerLeave}
    >
      <span className={clsx("fn-glass-1", props.classNameBorder)} />
      <span className={clsx("fn-glass-2", props.classNameBorder)} />
      {props.scrollableX || props.scrollableY ? (
        <Scrollable
          ref={props.refInner}
          className={clsx("fn-box-inner", props.classNameInner)}
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
          className={clsx("fn-box-inner", props.classNameInner)}
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
        "fn-centered-box-bg",
        props.classNameOuter,
        props.hidden && "hidden"
      )}
    >
      <Box
        refInner={props.refInner}
        classNameOuter=""
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
      className={clsx("fn-warning-box", props.hidden && "hidden")}
      ref={props.refOuter}
      style={props.styleOuter}
      onClick={props.onClick}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
    >
      <span className={clsx("fn-glass-1", props.classNameBorder)} />
      <span className={clsx("fn-glass-2", props.classNameBorder)} />
      {props.children}
    </div>
  );
}
