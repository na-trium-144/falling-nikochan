import { useRealFPS } from "@/common/fpsCalculator";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  callback: () => void;
  setRunFPS: (fps: number) => void;
  setRenderFPS: (fps: number) => void;
}
export function useStableFrame({ callback, setRunFPS, setRenderFPS }: Props) {
  const callbackRef = useRef<() => void>(null!);
  callbackRef.current = callback;

  const [rerenderIndex, setRerenderIndex] = useState<number>(0);
  const { realFps } = useRealFPS();
  const realFpsRef = useRef<number>(20);
  realFpsRef.current = realFps;
  // レンダリング等nikochanの1フレームの処理にかかる時間の測定
  // triggered: requestAnimationFrame() でセット
  // executedIndex: render関数が実行されたらセット
  const runTriggeredTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  const runTriggeredIndex = useRef<number>(0);
  const runExecutedIndex = useRef<number>(0);
  const runDeltas = useRef<DOMHighResTimeStamp[]>([]);
  const runFps = useRef<number>(60);
  // 最終的なFPS
  const renderFpsCounter = useRef<DOMHighResTimeStamp[]>([]);
  useEffect(() => {
    let animFrame: ReturnType<typeof requestAnimationFrame>;
    let prevRerender = performance.now();
    const updateLoop = () => {
      animFrame = requestAnimationFrame(updateLoop);
      performance.mark("updateLoop");

      if (
        runExecutedIndex.current >= runTriggeredIndex.current &&
        runTriggeredTimeStamp.current !== null
      ) {
        // 別タブ・別ウィンドウに切り替えた時など、一時的に時間が飛んだ場合をスキップ
        if (performance.now() - runTriggeredTimeStamp.current < 100) {
          runDeltas.current.push(
            performance.now() - runTriggeredTimeStamp.current
          );
        }
        runTriggeredTimeStamp.current = null;
      }

      if (runDeltas.current.length > Math.max(runFps.current, 20)) {
        const runDeltaSum = runDeltas.current.reduce((a, b) => a + b, 0);
        const avgRunDelta = runDeltaSum / runDeltas.current.length;
        runFps.current = Math.round(1000 / avgRunDelta);
        setRunFPS(runFps.current);
        runDeltas.current = [];
      }

      // フレームレートがrunFps程度になるように抑えつつ一定の間隔でrerenderを呼び出すようにする
      const realMs = 1000 / realFpsRef.current;
      let runFrameCount = 1;
      while (
        // 例: realFps=120の場合、90fps以上->120, 51.5fps以上->60, 36.0fps以上->40...
        realFpsRef.current / (runFrameCount + 0.33) >
        Math.max(runFps.current, 20)
      ) {
        runFrameCount++;
      }
      const nowMs = performance.now() - prevRerender;
      if (
        runTriggeredTimeStamp.current === null &&
        Math.round(nowMs / realMs) >= runFrameCount
      ) {
        setRerenderIndex((r) => {
          runTriggeredIndex.current = r + 1;
          return r + 1;
        });
        runTriggeredTimeStamp.current = performance.now();
        if (Math.round(nowMs / realMs) >= 3 * runFrameCount) {
          // 大幅に遅延している場合
          // console.log("large delay:", nowMs);
          prevRerender = performance.now();
        } else {
          prevRerender += realMs * runFrameCount;
        }
      }
    };
    animFrame = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrame);
  }, [setRunFPS]);
  useLayoutEffect(() => {
    if (runExecutedIndex.current !== rerenderIndex) {
      callbackRef.current();
      
      // performance.mark("nikochan-rerender");
      runExecutedIndex.current = rerenderIndex;
      renderFpsCounter.current.push(performance.now());
    }
  }, [rerenderIndex]);

  useEffect(() => {
    const i = setInterval(() => {
      while (
        renderFpsCounter.current.at(0) &&
        renderFpsCounter.current.at(-1)! - renderFpsCounter.current.at(0)! >
          1000
      ) {
        renderFpsCounter.current.shift();
      }
      setRenderFPS(renderFpsCounter.current.length);
    }, 100);
    return () => clearInterval(i);
  }, [setRenderFPS]);
}
