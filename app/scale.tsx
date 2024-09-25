"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface DisplayMode {
  isMobile: boolean;
  isTouch: boolean;
  scaledSize: { width: number; height: number };
}
const DisplayModeContext = createContext<DisplayMode>({
  isMobile: false,
  isTouch: false,
  scaledSize: { width: 1, height: 1 },
});
export const useDisplayMode = () => useContext(DisplayModeContext);

export function AutoScaler(props: { children: ReactNode }) {
  const [size, setSize] = useState([1, 1]);
  useEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const [width, height] = size;
  // スクリーンが縦長かどうかで表示を切り替えている
  const isMobile = width < height;
  const globalScale = Math.min(height / 800, width / 500);
  // タッチ操作かどうか (操作説明が変わる)
  const isTouch = isTouchEventsEnabled();

  const scaledWidth = width / globalScale;
  const scaledHeight = height / globalScale;

  return (
    <DisplayModeContext.Provider
      value={{
        isMobile,
        isTouch,
        scaledSize: {
          width: scaledWidth,
          height: scaledHeight,
        },
      }}
    >
      <div
        className="origin-top-left overflow-auto"
        style={{
          transform: `scale(${globalScale})`,
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        <div className="bg-gradient-to-t from-sky-50 to-sky-200 min-w-full min-h-full">
          {props.children}
        </div>
      </div>
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
