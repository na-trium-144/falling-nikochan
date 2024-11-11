"use client";

import { useEffect, useState } from "react";

interface DisplayMode {
  isTouch: boolean;
  screenWidth: number;
  screenHeight: number;
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

  const isMobile = width < height;
  const scalingWidthThreshold = 400 * (isMobile ? 1 : 1.5);
  const playUIScale = Math.min(width / scalingWidthThreshold, 1);
  const mobileStatusScale = Math.min(width / (31 * rem), 1);
  const largeResultThreshold = 32 * rem * (isMobile ? 1 : 1.5);
  const largeResult = width >= largeResultThreshold;

  // タッチ操作かどうか (操作説明が変わる)
  const isTouch = isTouchEventsEnabled();

  return {
    isTouch,
    screenWidth: width,
    screenHeight: height,
    rem,
    playUIScale,
    mobileStatusScale,
    largeResult,
  };
}

function isTouchEventsEnabled() {
  if (typeof window === "undefined") {
    return false;
  } else {
    // Bug in FireFox+Windows 10, navigator.maxTouchPoints is incorrect when script is running inside frame.
    // TBD: report to bugzilla.
    const navigator = (window.top || window).navigator;
    const maxTouchPoints = Number.isFinite(navigator.maxTouchPoints)
      ? navigator.maxTouchPoints
      : (navigator as any).msMaxTouchPoints;
    if (Number.isFinite(maxTouchPoints)) {
      // Windows 10 system reports that it supports touch, even though it acutally doesn't (ignore msMaxTouchPoints === 256).
      return maxTouchPoints > 0 && maxTouchPoints !== 256;
    }
    return "ontouchstart" in window;
  }
}
