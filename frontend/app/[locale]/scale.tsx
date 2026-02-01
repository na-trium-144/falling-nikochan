"use client";

import { useEffect, useState } from "react";

interface DisplayMode {
  isTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  isMobileMain: boolean;
  rem: number;
  playUIScale: number;
  statusScale: number;
  largeResult: boolean;
}
export function useDisplayMode(): DisplayMode {
  const [size, setSize] = useState([1, 1]);
  const [rem, setRem] = useState<number>(16);
  useEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
      setRem(parseFloat(getComputedStyle(document.documentElement).fontSize));
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const [width, height] = size;

  const isMobileMain = width < 48 * rem; // global.css と合わせる
  const isMobileGame = width < height;
  const scalingWidthThreshold1 = 400 * (isMobileGame ? 1.1 : 1.6);
  const scalingWidthThreshold2 = 600 * (isMobileGame ? 1.1 : 1.6);
  const playUIScale =
    width > scalingWidthThreshold2
      ? (width / scalingWidthThreshold2) ** 0.5
      : width > scalingWidthThreshold1
        ? 1
        : width / scalingWidthThreshold1;
  const statusScale = isMobileGame
    ? Math.min(width / (31 * rem), 1)
    : (width > scalingWidthThreshold2
        ? (width / scalingWidthThreshold2) ** 0.5
        : 1) * 0.8;
  const largeResultThreshold = 32 * rem * (isMobileGame ? 1 : 1.5);
  const largeResult = width >= largeResultThreshold;

  // タッチ操作かどうか (操作説明が変わる)
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(hasTouch());
  }, []);

  return {
    isTouch,
    screenWidth: width,
    screenHeight: height,
    isMobileMain,
    rem,
    playUIScale,
    statusScale,
    largeResult,
  };
}

export function hasTouch() {
  // Bug in FireFox+Windows 10, navigator.maxTouchPoints is incorrect when script is running inside frame.
  // TBD: report to bugzilla.
  const navigator = (window.top || window).navigator;
  const maxTouchPoints = Number.isFinite(navigator.maxTouchPoints)
    ? navigator.maxTouchPoints
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).msMaxTouchPoints;
  if (Number.isFinite(maxTouchPoints)) {
    // Windows 10 system reports that it supports touch, even though it acutally doesn't (ignore msMaxTouchPoints === 256).
    return maxTouchPoints > 0 && maxTouchPoints !== 256;
  } else {
    return "ontouchstart" in window;
  }
}
