"use client";

import { useEffect, useState } from "react";
import * as v from "valibot";

function parseFromLocalStorage() {
  try {
    if (localStorage.getItem("fpsCalculator")) {
      const parsed = v.parse(
        v.object({ fps: v.number(), hasStableValue: v.boolean() }),
        JSON.parse(localStorage.getItem("fpsCalculator")!)
      );
      return parsed;
    }
  } catch (e) {
    console.error(
      `Error parsing fpsCalculator:`,
      v.isValiError(e) ? v.flatten(e.issues) : e
    );
    // ignore error
  }
  return { fps: 20, hasStableValue: false };
}
export function useRealFPS() {
  const [fps, setFPS] = useState(20);
  const [hasStableValue, setHasStableValue] = useState(false);
  useEffect(() => {
    const update = () => {
      let { fps, hasStableValue } = parseFromLocalStorage();
      setFPS(fps);
      setHasStableValue(hasStableValue);
    };
    update();
    const i = setInterval(update, 100);
    return () => clearInterval(i);
  }, []);
  return { fps, hasStableValue };
}

export function FPSCalculator() {
  const [fps, setFPS] = useState(20);
  const [hasStableValue, setHasStableValue] = useState(false);
  useEffect(() => {
    let { fps, hasStableValue } = parseFromLocalStorage();
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
            // console.log("FPSCalculator:", fps);
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

  return null;
}
