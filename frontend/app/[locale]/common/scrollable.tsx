"use client";

import { useDisplayMode } from "@/scale";
import clsx from "clsx/lite";
import {
  CSSProperties,
  ElementType,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
} from "react";

interface Props<T extends ElementType> {
  as?: T;
  padding?: number;
  className?: string;
  style?: object;
  children: ReactNode;
  ref?: RefObject<HTMLDivElement | null>;
  scrollableX?: boolean;
  scrollableY?: boolean;
}
export function Scrollable<T extends ElementType = "div">(props: Props<T>) {
  const myRef = useRef<HTMLDivElement>(null);
  const ref = props.ref || myRef;
  const { rem } = useDisplayMode();
  const { scrollableX, scrollableY, padding } = props;
  useEffect(() => {
    const refCurrent = ref.current;
    if (refCurrent) {
      let redrawing = false;
      const redraw = () => {
        // Safariでmask-image書き換え時に描画されなくなるバグがあるため、opacityを書き換えて強制的に再描画させる
        if (redrawing) return;
        const childOpacities: [HTMLElement, string, string][] = [];
        for (const child of refCurrent.children) {
          if ("style" in child) {
            const originalOpacity = (child as HTMLElement).style.opacity || "";
            const computedOpacity = getComputedStyle(
              child as HTMLElement
            ).opacity;
            childOpacities.push([
              child as HTMLElement,
              computedOpacity,
              originalOpacity,
            ]);
          }
        }
        redrawing = true;
        requestAnimationFrame(() => {
          for (const [child, computedOpacity] of childOpacities) {
            child.style.opacity = String(
              Number(computedOpacity || "1") * 0.999
            );
          }
          requestAnimationFrame(() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [child, _, originalOpacity] of childOpacities) {
              child.style.opacity = originalOpacity; // Restore the original opacity
            }
            redrawing = false;
          });
        });
      };

      let prevFadeTop = -1;
      let prevFadeBottom = -1;
      let prevFadeLeft = -1;
      let prevFadeRight = -1;
      const onScroll = () => {
        const fadeTop = refCurrent.scrollTop;
        const fadeBottom =
          refCurrent.scrollHeight -
          (refCurrent.clientHeight + refCurrent.scrollTop);
        const fadeLeft = refCurrent.scrollLeft;
        const fadeRight =
          refCurrent.scrollWidth -
          (refCurrent.clientWidth + refCurrent.scrollLeft);

        if (
          fadeTop !== prevFadeTop ||
          fadeBottom !== prevFadeBottom ||
          fadeLeft !== prevFadeLeft ||
          fadeRight !== prevFadeRight
        ) {
          prevFadeTop = fadeTop;
          prevFadeBottom = fadeBottom;
          prevFadeLeft = fadeLeft;
          prevFadeRight = fadeRight;
          const toPosition = (fade: number) =>
            `calc(var(--spacing) * ${(padding ?? 0) / 2} + min(${refCurrent.clientWidth / 3}px, ${refCurrent.clientHeight / 3}px, 4rem, ${fade * 3}px))`;
          const fromColor = (fade: number) =>
            `rgb(0 0 0 / ${Math.max(0, 1 - fade / rem)})`;
          if (scrollableX) {
            for (const [direction, fade] of [
              ["right", fadeLeft],
              ["left", fadeRight],
            ] as const) {
              refCurrent.style.setProperty(
                `--tw-mask-${direction}-to-position`,
                toPosition(fade)
              );
              refCurrent.style.setProperty(
                `--tw-mask-${direction}-from-color`,
                fromColor(fade)
              );
            }
          }
          if (scrollableY) {
            for (const [direction, fade] of [
              ["bottom", fadeTop],
              ["top", fadeBottom],
            ] as const) {
              refCurrent.style.setProperty(
                `--tw-mask-${direction}-to-position`,
                toPosition(fade)
              );
              refCurrent.style.setProperty(
                `--tw-mask-${direction}-from-color`,
                fromColor(fade)
              );
            }
          }
          redraw();
        }
      };
      onScroll();

      refCurrent.addEventListener("scroll", onScroll);
      const resizeObserver = new ResizeObserver(onScroll);
      resizeObserver.observe(refCurrent);

      let childMutationObservers: MutationObserver[] = [];
      const initChildObserver = () => {
        onScroll();
        for (const observer of childMutationObservers) {
          observer.disconnect();
        }
        childMutationObservers = [];
        for (const child of refCurrent.childNodes) {
          const childMutationObserver = new MutationObserver(onScroll);
          childMutationObserver.observe(child, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true,
          });
          childMutationObservers.push(childMutationObserver);
        }
      };
      const mutationObserver = new MutationObserver(initChildObserver);
      mutationObserver.observe(refCurrent, {
        childList: true,
        characterData: true,
      });

      return () => {
        refCurrent.removeEventListener("scroll", onScroll);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        for (const observer of childMutationObservers) {
          observer.disconnect();
        }
      };
    }
  }, [ref, padding, rem, scrollableX, scrollableY]);
  const Component = props.as || "div";
  return (
    <Component
      ref={ref}
      className={clsx(
        props.className,
        scrollableX && "overflow-x-auto",
        scrollableY && "overflow-y-auto",
        // jsがロードされるまでの間の初期値としてbottomのみ適当なサイズのフェードを有効化する
        scrollableY && "mask-b-to-0 mask-b-from-black mask-b-to-black",
        scrollableY && "mask-t-to-10 mask-t-from-transparent mask-t-to-black",
        scrollableX && "mask-r-to-0 mask-r-from-black mask-r-to-black",
        scrollableX && "mask-l-to-0 mask-l-from-black mask-l-to-black"
      )}
      style={
        {
          ...props.style,
          willChange: "mask-image",
          padding: padding ? `calc(var(--spacing) * ${padding})` : undefined,
          "--tw-mask-bottom-from-position": `calc(var(--spacing) * ${(padding ?? 0) / 2})`,
          "--tw-mask-top-from-position": `calc(var(--spacing) * ${(padding ?? 0) / 2})`,
          "--tw-mask-right-from-position": `calc(var(--spacing) * ${(padding ?? 0) / 2})`,
          "--tw-mask-left-from-position": `calc(var(--spacing) * ${(padding ?? 0) / 2})`,
        } as CSSProperties
      }
    >
      {props.children}
    </Component>
  );
}
