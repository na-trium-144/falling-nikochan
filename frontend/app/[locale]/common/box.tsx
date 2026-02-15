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
  const {
    refOuter,
    refInner,
    hidden,
    classNameOuter,
    classNameInner,
    classNameBorder,
    styleOuter,
    styleInner,
    onClick,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    scrollableX,
    scrollableY,
    padding,
    children,
  } = props;
  return (
    <div
      ref={refOuter}
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
        hidden && "hidden",
        classNameOuter
      )}
      style={styleOuter}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <span className={clsx("fn-glass-1", classNameBorder)} />
      <span className={clsx("fn-glass-2", classNameBorder)} />
      {scrollableX || scrollableY ? (
        <Scrollable
          ref={refInner}
          className={clsx("fn-box-inner", classNameInner)}
          style={styleInner}
          padding={padding ?? 0}
          scrollableX={scrollableX}
          scrollableY={scrollableY}
        >
          {children}
        </Scrollable>
      ) : (
        <div
          ref={refInner}
          className={clsx("fn-box-inner", classNameInner)}
          style={{
            ...styleInner,
            padding: padding
              ? `calc(var(--spacing) * ${padding})`
              : undefined,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function CenterBox(props: Props) {
  const {
    refOuter,
    refInner,
    hidden,
    classNameOuter,
    classNameInner,
    styleOuter,
    styleInner,
    scrollableX,
    scrollableY,
    padding,
    onClick,
    onPointerDown,
    onPointerUp,
    children,
  } = props;
  return (
    <div
      ref={refOuter}
      className={clsx(
        "fn-centered-box-bg",
        classNameOuter,
        hidden && "hidden"
      )}
    >
      <Box
        refInner={refInner}
        classNameOuter=""
        classNameInner={clsx(classNameInner)}
        styleOuter={styleOuter}
        styleInner={styleInner}
        scrollableX={scrollableX}
        scrollableY={scrollableY}
        padding={padding ?? 6}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {children}
      </Box>
    </div>
  );
}

export function WarningBox(props: Props) {
  const {
    refOuter,
    hidden,
    classNameBorder,
    styleOuter,
    onClick,
    onPointerDown,
    onPointerUp,
    children,
  } = props;
  return (
    <div
      className={clsx("fn-warning-box", hidden && "hidden")}
      ref={refOuter}
      style={styleOuter}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <span className={clsx("fn-glass-1", classNameBorder)} />
      <span className={clsx("fn-glass-2", classNameBorder)} />
      {children}
    </div>
  );
}
