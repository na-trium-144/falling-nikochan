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
  const { ref: refProp, as, padding: paddingProp, className, style, children, scrollableX, scrollableY } = props;
  const myRef = useRef<HTMLDivElement>(null);
  const ref = refProp || myRef;
  const { rem } = useDisplayMode();
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

          refCurrent.style.setProperty(
            "--fade-max",
            Math.min(refCurrent.clientWidth / 3, refCurrent.clientHeight / 3) +
              "px"
          );
          if (scrollableX) {
            for (const [direction, fade] of [
              ["left", fadeLeft],
              ["right", fadeRight],
            ] as const) {
              refCurrent.style.setProperty(
                `--fade-${direction}`,
                fade * 3 + "px"
              );
              refCurrent.style.setProperty(
                `--alpha-${direction}`,
                String(Math.max(0, 1 - fade / rem))
              );
            }
          }
          if (scrollableY) {
            for (const [direction, fade] of [
              ["top", fadeTop],
              ["bottom", fadeBottom],
            ] as const) {
              refCurrent.style.setProperty(
                `--fade-${direction}`,
                fade * 3 + "px"
              );
              refCurrent.style.setProperty(
                `--alpha-${direction}`,
                String(Math.max(0, 1 - fade / rem))
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
  }, [ref, paddingProp, rem, scrollableX, scrollableY]);
  const Component = as || "div";
  return (
    <Component
      ref={ref}
      className={clsx(
        "fn-scrollable",
        scrollableX && "fn-scrollable-x",
        scrollableY && "fn-scrollable-y",
        className
      )}
      style={
        {
          ...style,
          "--padding": paddingProp ? `calc(var(--spacing) * ${paddingProp})` : "0px",
        } as CSSProperties
      }
    >
      {children}
    </Component>
  );
}
