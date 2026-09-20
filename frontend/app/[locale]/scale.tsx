"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

interface DisplayMode {
  isTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  isMobileMain: boolean;
  isMobileEdit: boolean;
  isMobileGame: boolean;
  rem: number;
  playUIScale: number;
  statusScale: number;
  mobilePlayUIHeightScale: number;
  largeResult: boolean;
}
export function useDisplayMode(): DisplayMode {
  const [size, setSize] = useState([1, 1]);
  const [rem, setRem] = useState<number>(16);
  useEffect(() => {
    if (window.location.pathname.includes("ogTemplate")) {
      setSize([1200, 630]);
    } else {
      function updateSize() {
        setSize([
          window.innerWidth,
          Math.max(
            // 高さは max(innerHeight, 100svh, 100dvh) にする
            window.innerHeight,
            document.querySelector(".fn-fallback-bg")?.clientHeight ?? 0
          ),
        ]);
        setRem(parseFloat(getComputedStyle(document.documentElement).fontSize));
      }
      window.addEventListener("resize", updateSize);
      updateSize();
      return () => window.removeEventListener("resize", updateSize);
    }
  }, []);

  const [width, height] = size;

  const isMobileMain = width < 48 * rem; // global.css と合わせる
  const isMobileEdit = width < 50 * rem; // global.css と合わせる
  // TODO: cssの切り替えはjs側のこの変数ではなく landscape: variantで切り替えたほうが良さそう
  // cssのlandscapeと挙動を合わせるため、正方形は縦長扱いとする
  const isMobileGame = width <= height;

  const scalingWidthThreshold2 = isMobileGame ? 32 * rem : 56 * rem;
  const playUIScale =
    width > scalingWidthThreshold2
      ? (width / scalingWidthThreshold2) ** 0.5
      : width / scalingWidthThreshold2;
  const statusScale = isMobileGame
    ? Math.min(width / (31 * rem), 1)
    : (width > scalingWidthThreshold2
        ? (width / scalingWidthThreshold2) ** 0.5
        : 1) * 0.8;
  // musicArea(50vw*9/16)とgrass(min(6rem,15vh))を除いた中央のエリアの高さが正方形より小さくなる場合
  // ただしiPadのようにサイズが大きい場合は問題ではない
  const mobilePlayUIHeight =
    height -
    Math.min(6 * statusScale * rem, 0.15 * height) -
    (width * 0.5 * 9) / 16;
  const mobilePlayUIHeightScale =
    mobilePlayUIHeight > 40 * rem || mobilePlayUIHeight > width
      ? 1
      : (mobilePlayUIHeight / Math.min(40 * rem, width)) ** 2;
  const largeResultThreshold = 32 * rem * (isMobileGame ? 1 : 1.5);
  const largeResult = width >= largeResultThreshold;

  // タッチ操作かどうか (操作説明が変わる)
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(hasTouch());
  }, []);

  useEffect(() => {
    Sentry.setContext("displayMode", {
      isMobileMain,
      isMobileEdit,
      isMobileGame,
      isTouch,
    });
  }, [isMobileMain, isMobileEdit, isMobileGame, isTouch]);

  return {
    isTouch,
    screenWidth: width,
    screenHeight: height,
    isMobileMain,
    isMobileEdit,
    isMobileGame,
    rem,
    playUIScale,
    statusScale,
    mobilePlayUIHeightScale,
    largeResult,
  };
}

export function hasTouch() {
  const maxTouchPoints = Number.isFinite(window.navigator.maxTouchPoints)
    ? window.navigator.maxTouchPoints
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).msMaxTouchPoints;
  if (Number.isFinite(maxTouchPoints)) {
    // Windows 10 system reports that it supports touch, even though it acutally doesn't (ignore msMaxTouchPoints === 256).
    return maxTouchPoints > 0 && maxTouchPoints !== 256;
  } else {
    return "ontouchstart" in window;
  }
}
