"use client";

import { useEffect, useState } from "react";

interface DisplayMode {
  isTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  isMobileMain: boolean;
  rem: number;
  playUIScale: number;
  mobileStatusScale: number;
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
  const scalingWidthThreshold = 400 * (isMobileGame ? 1.1 : 1.6);
  const playUIScale = Math.min(width / scalingWidthThreshold, 1);
  const mobileStatusScale = Math.min(width / (31 * rem), 1);
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
    mobileStatusScale,
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

export function isInsideFrame() {
  return window.self !== window.top;
}
export function useInsideFrameDetector() {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => setState(isInsideFrame()), []);
  return state;
}
