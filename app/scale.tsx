"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface DisplayMode {
  isTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  rem: number;
}
const DisplayModeContext = createContext<DisplayMode>({
  isTouch: false,
  screenWidth: 1,
  screenHeight: 1,
  rem: 16,
});
export const useDisplayMode = () => useContext(DisplayModeContext);

export function AutoScaler(props: { children: ReactNode }) {
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

  // タッチ操作かどうか (操作説明が変わる)
  const isTouch = isTouchEventsEnabled();

  return (
    <DisplayModeContext.Provider
      value={{
        isTouch,
        screenWidth: width,
        screenHeight: height,
        rem,
      }}
    >
      {props.children}
    </DisplayModeContext.Provider>
  );
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
