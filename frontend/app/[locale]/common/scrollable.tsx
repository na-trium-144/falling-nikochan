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
}
export function Scrollable<T extends ElementType = "div">(props: Props<T>) {
  const myRef = useRef<HTMLDivElement>(null);
  const ref = props.ref || myRef;
  const { rem } = useDisplayMode();
  useEffect(() => {
    const refCurrent = ref.current;
    if (refCurrent) {
      let redrawing = false;
      const redraw = () => {
        // Safariでmask-image書き換え時に描画されなくなるバグがあるため、opacityを書き換えて強制的に再描画させる
        if (redrawing) return;
        const childOpacities: [HTMLElement, string][] = [];
        for (const child of refCurrent.children) {
          if ("style" in child) {
            const originalOpacity = (child as HTMLElement).style.opacity;
            childOpacities.push([child as HTMLElement, originalOpacity]);
          }
        }
        redrawing = true;
        requestAnimationFrame(() => {
          for (const [child, originalOpacity] of childOpacities) {
            child.style.opacity = String(
              Number(originalOpacity || "1") * 0.999
            );
          }
          requestAnimationFrame(() => {
            for (const [child, originalOpacity] of childOpacities) {
              child.style.opacity = originalOpacity;
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
          for (const [direction, fade] of [
            ["bottom", fadeTop],
            ["top", fadeBottom],
            ["right", fadeLeft],
            ["left", fadeRight],
          ] as const) {
            refCurrent.style.setProperty(
              `--tw-mask-${direction}-to-position`,
              `calc(var(--spacing) * ${props.padding ?? 0} + min(${refCurrent.clientHeight / 2}px, 4rem, ${fade * 3}px))`
            );
            refCurrent.style.setProperty(
              `--tw-mask-${direction}-from-color`,
              `rgb(0 0 0 / ${Math.max(0, 1 - fade / rem)})`
            );
            redraw();
          }
        }
      };
      onScroll();

      refCurrent.addEventListener("scroll", onScroll);
      const resizeObserver = new ResizeObserver(onScroll);
      resizeObserver.observe(refCurrent);

      let childMutationObservers: MutationObserver[] = [];
      const initChildObserver = () => {
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
  }, [ref, props.padding, rem]);
  const Component = props.as || "div";
  return (
    <Component
      ref={ref}
      className={clsx(
        props.className,
        "overflow-auto",
        // jsがロードされるまでの間の初期値としてbottomのみ適当なサイズのフェードを有効化する
        "mask-b-to-0 mask-b-from-black mask-b-to-black",
        "mask-t-to-10 mask-t-from-transparent mask-t-to-black",
        "mask-r-to-0 mask-r-from-black mask-r-to-black",
        "mask-l-to-0 mask-l-from-black mask-l-to-black"
      )}
      style={
        {
          ...props.style,
          willChange: "mask-image",
          "--tw-mask-bottom-from-position": `calc(var(--spacing) * ${props.padding ?? 0})`,
          "--tw-mask-top-from-position": `calc(var(--spacing) * ${props.padding ?? 0})`,
          "--tw-mask-right-from-position": `calc(var(--spacing) * ${props.padding ?? 0})`,
          "--tw-mask-left-from-position": `calc(var(--spacing) * ${props.padding ?? 0})`,
        } as CSSProperties
      }
    >
      {props.children}
    </Component>
  );
}
