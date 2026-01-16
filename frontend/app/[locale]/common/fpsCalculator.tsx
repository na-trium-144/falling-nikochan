"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const FPSContext = createContext<number>(20);

export const useRealFPS = () => useContext(FPSContext);

export function FPSCalculatorProvider(props: { children: ReactNode }) {
  const [fps, setFPS] = useState(20);
  useEffect(() => {
    const fps = Number(localStorage.getItem("fpsCalculator") ?? "20");
    setFPS(fps);
    let deltas = new Float64Array(fps * 5);
    let i = 0;
    let lastTimeStamp = performance.now();
    let req: ReturnType<typeof requestAnimationFrame>;
    function calculateFPS() {
      // 別タブ・別ウィンドウに切り替えた時など、一時的に時間が飛んだ場合をスキップ
      if (performance.now() - lastTimeStamp < 100) {
        deltas[i++] = performance.now() - lastTimeStamp;
        if (i === deltas.length) {
          deltas.sort();
          if (
            deltas[Math.round((deltas.length * 3) / 4)] /
              deltas[Math.round(deltas.length / 4)] >
            1.5
          ) {
            console.log("FPSCalculator: variation too large.");
          } else {
            const fps = 1000 / deltas[Math.round(deltas.length / 2)];
            console.log("FPSCalculator:", fps);
            setFPS(fps);
            localStorage.setItem("fpsCalculator", fps.toString());
            deltas = new Float64Array(fps * 5);
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
    <FPSContext.Provider value={fps}>{props.children}</FPSContext.Provider>
  );
}
