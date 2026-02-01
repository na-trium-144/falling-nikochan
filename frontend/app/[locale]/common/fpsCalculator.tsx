"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const FPSContext = createContext<{ realFps: number; stable: boolean }>({
  realFps: 20,
  stable: false,
});

export const useRealFPS = () => useContext(FPSContext);

export function FPSCalculatorProvider(props: { children: ReactNode }) {
  const [fps, setFPS] = useState(20);
  const [hasStableValue, setHasStableValue] = useState(false);
  useEffect(() => {
    let fps = 20;
    let hasStableValue = false;
    try {
      const parsed = JSON.parse(localStorage.getItem("fpsCalculator")!) as {
        fps?: number;
        hasStableValue?: boolean;
      };
      if ("fps" in parsed && typeof parsed.fps === "number") {
        fps = parsed.fps;
        setFPS(fps);
      }
      if (
        "hasStableValue" in parsed &&
        typeof parsed.hasStableValue === "boolean"
      ) {
        hasStableValue = parsed.hasStableValue;
        setHasStableValue(hasStableValue);
      }
    } catch {
      // ignore error
    }
    let deltas = new Float64Array(Math.max(100, Math.min(1000, fps * 5)));
    let i = 0;
    let lastTimeStamp = performance.now();
    let req: ReturnType<typeof requestAnimationFrame>;
    function calculateFPS() {
      // 別タブ・別ウィンドウに切り替えた時など、一時的に時間が飛んだ場合をスキップ
      if (performance.now() - lastTimeStamp < 100) {
        deltas[i++] = performance.now() - lastTimeStamp;
        if (i === deltas.length) {
          deltas.sort();
          const isStable =
            deltas[Math.round((deltas.length * 3) / 4)] /
              deltas[Math.round(deltas.length / 4)] <
            1.5;
          if (!isStable && hasStableValue) {
            console.log("FPSCalculator: variation too large.");
          } else {
            fps = 1000 / deltas[Math.round(deltas.length / 2)];
            setFPS(fps);
            console.log("FPSCalculator:", fps);
            hasStableValue = isStable;
            setHasStableValue(isStable);
            localStorage.setItem(
              "fpsCalculator",
              JSON.stringify({ fps, hasStableValue })
            );
            deltas = new Float64Array(Math.max(100, Math.min(1000, fps * 5)));
          }
          i = 0;
        }
      }
      lastTimeStamp = performance.now();
      req = requestAnimationFrame(calculateFPS);
    }
    req = requestAnimationFrame(calculateFPS);
    return () => cancelAnimationFrame(req);
  }, []);

  return (
    <FPSContext.Provider value={{ realFps: fps, stable: hasStableValue }}>
      {props.children}
    </FPSContext.Provider>
  );
}
