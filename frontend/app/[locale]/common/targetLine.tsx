import clsx from "clsx/lite";
import { Ref, useCallback, useImperativeHandle, useRef } from "react";

export interface TargetLineHandler {
  flash: (x: FlashPos) => void;
}
export type FlashPos = { targetX: number } | { clientX: number } | undefined;

export function useFlash() {
  const flashRef = useRef<TargetLineHandler | null>(null);
  const flash = useCallback(
    (pos: FlashPos) => flashRef.current?.flash(pos),
    []
  );
  return { flashRef, flash };
}

interface Props {
  className?: string;
  style?: object;
  left: number | string;
  right?: number | string;
  width?: number | string;
  bottom: number | string;
  // TargetLineの左端からの画面上のx座標距離(px), またはleft: calc({} - 100%)に入れられる文字列
  flashPosToPixel: (pos: FlashPos) => number | string | undefined;
  ref?: Ref<TargetLineHandler>;
}
export default function TargetLine(props: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const divShadowRef = useRef<HTMLDivElement>(null);
  const { flashPosToPixel } = props;

  // キーを押したとき一定時間光らせる
  // shadowが広がるアニメーションの開始位置
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrame = useRef<ReturnType<
    typeof requestAnimationFrame
  > | null>(null);
  useImperativeHandle(
    props.ref,
    () => ({
      flash: function flash_(x: FlashPos) {
        if (timeout.current !== null) {
          clearTimeout(timeout.current);
        }
        if (animationFrame.current !== null) {
          cancelAnimationFrame(animationFrame.current);
        }
        if (divRef.current?.classList.contains("fn-flash")) {
          divRef.current?.classList.remove("fn-flash");
          divShadowRef.current?.classList.remove("fn-flash");
          animationFrame.current = requestAnimationFrame(() => flash_(x));
        } else {
          divRef.current?.classList.remove("fn-flash");
          divShadowRef.current?.classList.remove("fn-flash");
          const pos = flashPosToPixel(x);
          if (pos !== undefined) {
            divRef.current?.classList.add("fn-flash");

            timeout.current = setTimeout(() => {
              animationFrame.current = requestAnimationFrame(() => {
                if (divShadowRef.current) {
                  divShadowRef.current.classList.add("fn-flash");
                  divShadowRef.current.style.left =
                    typeof pos === "number"
                      ? `calc(${pos}px - 100%)`
                      : `calc(${pos} - 100%)`;
                }
              });
              timeout.current = setTimeout(() => {
                divRef.current?.classList.remove("fn-flash");
                timeout.current = setTimeout(() => {
                  divShadowRef.current?.classList.remove("fn-flash");
                }, 400);
              }, 100);
            });
          }
        }
      },
    }),
    [flashPosToPixel]
  );

  return (
    <div
      ref={divRef}
      className={clsx("fn-target-line", props.className)}
      style={{
        left: props.left,
        right: props.right,
        width: props.width,
        bottom: props.bottom,
        ...props.style,
      }}
    >
      <div ref={divShadowRef} className="fn-target-line-shadow" />
    </div>
  );
}
