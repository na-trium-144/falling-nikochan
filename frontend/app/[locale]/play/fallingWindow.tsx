"use client";

import clsx from "clsx/lite";
import { RefObject, useEffect, useRef, useState } from "react";
import {
  targetY,
  bigScale,
  DisplayNote,
  displayNote,
  NoteInGame,
} from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import { useRealFPS } from "@/common/fpsCalculator";
import { DisplayNikochan } from "./displayNikochan";
import { OffsetEstimator } from "./offsetEstimator";
import { fetchAsset } from "@/common/fetch";
import { useTheme } from "@/common/theme";

type Props = {
  className?: string;
  style?: object;
  blur?: boolean;
  notes: NoteInGame[];
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  setRunFPS: (fps: number) => void;
  setRenderFPS: (fps: number) => void;
  barFlash: FlashPos;
  noClear: boolean;
  playbackRate: number;
  setShouldHideBPMSign: (hide: boolean) => void;
  shouldHideBPMSign: boolean;
} & (
  | {
      showTSOffset: boolean;
      // 以下、tsOffsetの表示にのみ使用
      rawStartTimeStamp: RefObject<DOMHighResTimeStamp | null>;
      filteredStartTimeStamp: RefObject<DOMHighResTimeStamp | null>;
      userOffset: number;
      audioLatency: number | null | undefined;
      posOfs: RefObject<number>;
      timeOfsEstimator: RefObject<OffsetEstimator | null>;
    }
  | {
      showTSOffset: false;
      rawStartTimeStamp?: undefined;
      filteredStartTimeStamp?: undefined;
      userOffset?: undefined;
      audioLatency?: undefined;
      posOfs?: undefined;
      timeOfsEstimator?: undefined;
    }
);
export type FlashPos = { targetX: number } | { clientX: number } | undefined;
export default function FallingWindow(props: Props) {
  const {
    notes,
    playing,
    getCurrentTimeSec,
    setRenderFPS,
    setRunFPS,
    noClear,
    playbackRate,
  } = props;
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  // nikochanの座標系で(0, 0)を指す位置がFallingWindowの座標系で(marginX, marginY)
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;
  const tailsCanvasRef = useRef<HTMLCanvasElement>(null);
  const nikochanCanvasRef = useRef<HTMLCanvasElement>(null);
  const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasLeft = useRef<number>(0);
  const canvasTop = useRef<number>(0);
  const canvasWidth = useRef<number>(0);
  const canvasHeight = useRef<number>(0);
  useEffect(() => {
    if (ref.current && marginX !== undefined && marginY !== undefined) {
      canvasLeft.current = -(
        (ref.current as HTMLDivElement).getBoundingClientRect().left +
        window.scrollX
      );
      canvasTop.current = -(
        (ref.current as HTMLDivElement).getBoundingClientRect().top +
        window.scrollY
      );
      canvasWidth.current = window.innerWidth;
      canvasHeight.current = window.innerHeight;
    }
  }, [ref, marginX, marginY]);
  const canvasMarginX =
    marginX !== undefined ? -canvasLeft.current + marginX : undefined;
  const canvasMarginY =
    marginY !== undefined ? -canvasTop.current + marginY : undefined;

  const { rem, playUIScale } = useDisplayMode();
  const { isDark } = useTheme();
  const noteSize = Math.max(1.5 * rem, 0.06 * (boxSize || 0));

  // devicePixelRatioを無視するどころか、あえて小さくすることで、ぼかす
  const tailsCanvasDPR = Math.min(1, 6.5 / noteSize);
  const effectsCanvasDPR = 0.5;
  const nikochanCanvasDPR = useRef<number>(1);
  useEffect(() => {
    nikochanCanvasDPR.current =
      window.devicePixelRatio * (props.blur ? 0.17 : 1);
  });

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

  const ctx = tailsCanvasRef.current?.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
  const nctx = nikochanCanvasRef.current?.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
  const ectx = effectsCanvasRef.current?.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });

  const nikochanBitmap = useRef<ImageBitmap[][] | null>(null); // nikochanBitmap.current[0-3][big:0|1]
  useEffect(() => {
    Promise.all(
      [0, 1, 2, 3].map(async (i) => {
        const svg = await fetchAsset()
          .get(`/assets/nikochan${i}.svg` + process.env.ASSET_QUERY_NIKOCHAN)
          .text();
        // chromeではcreateImageBitmap()でsvgをきれいにresizeできるが、
        // firefoxではbitmap化してから拡大縮小するようなので、svg自体をリサイズしてからbitmap化する必要がある
        const svgResized = svg
          .replace(
            /width="(\d+)(\w*)"/,
            `width="${noteSize * nikochanCanvasDPR.current}"`
          )
          .replace(
            /height="(\d+)(\w*)"/,
            `height="${noteSize * nikochanCanvasDPR.current}"`
          );
        const img = new Image();
        img.src = `data:image/svg+xml;base64,${btoa(svgResized)}`;
        const pBitmap = img.decode().then(() =>
          createImageBitmap(img, {
            resizeWidth: noteSize * nikochanCanvasDPR.current,
            resizeHeight: noteSize * nikochanCanvasDPR.current,
            resizeQuality: "high",
          })
        );
        const svgResizedBig = svg
          .replace(
            /width="(\d+)(\w*)"/,
            `width="${noteSize * bigScale(true) * nikochanCanvasDPR.current}"`
          )
          .replace(
            /height="(\d+)(\w*)"/,
            `height="${noteSize * bigScale(true) * nikochanCanvasDPR.current}"`
          );
        const imgBig = new Image();
        imgBig.src = `data:image/svg+xml;base64,${btoa(svgResizedBig)}`;
        const pBitmapBig = imgBig.decode().then(() =>
          createImageBitmap(imgBig, {
            resizeWidth: noteSize * bigScale(true) * nikochanCanvasDPR.current,
            resizeHeight: noteSize * bigScale(true) * nikochanCanvasDPR.current,
            resizeQuality: "high",
          })
        );
        return Promise.all([pBitmap, pBitmapBig]);
      })
    ).then((bitmaps) => {
      nikochanBitmap.current = bitmaps;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteSize, nikochanCanvasDPR.current]);

  const displayNotes = useRef<DisplayNote[]>([]);
  const displayNikochan = useRef<(DisplayNikochan | null)[]>([]);
  useEffect(() => {
    displayNotes.current = [];
    displayNikochan.current = [];
    while (notes.length >= displayNikochan.current.length) {
      displayNikochan.current.push(null);
    }
  }, [notes]);
  const lastNow = useRef<number>(0);
  if (runExecutedIndex.current !== rerenderIndex) {
    // performance.mark("nikochan-rerender");
    runExecutedIndex.current = rerenderIndex;
    renderFpsCounter.current.push(performance.now());
    const now = getCurrentTimeSec();
    if (
      playing &&
      marginX !== undefined &&
      marginY !== undefined &&
      canvasMarginX !== undefined &&
      canvasMarginY !== undefined &&
      boxSize &&
      now !== undefined &&
      nikochanBitmap.current
    ) {
      let shouldHideBPMSign = false;

      const c = {
        noteSize,
        boxSize,
        playUIScale,
        canvasMarginX,
        canvasMarginY,
        marginY,
        playbackRate,
        rem,
        now,
        tailsCanvasDPR,
        effectsCanvasDPR,
        nikochanCanvasDPR: nikochanCanvasDPR.current,
        nikochanBitmap: nikochanBitmap.current,
        lastNow: lastNow.current,
        dark: isDark,
      };

      displayNotes.current = notes
        .map((n) => displayNote(n, now))
        .filter((n) => n !== null);
      displayNotes.current.reverse(); // 奥に表示されるものが最初

      if (ectx && nctx && ctx) {
        ectx.clearRect(
          0,
          0,
          canvasWidth.current * effectsCanvasDPR,
          canvasHeight.current * effectsCanvasDPR
        );
        nctx.clearRect(
          0,
          0,
          canvasWidth.current * nikochanCanvasDPR.current,
          canvasHeight.current * nikochanCanvasDPR.current
        );
        ctx.clearRect(
          0,
          0,
          canvasWidth.current * tailsCanvasDPR,
          canvasHeight.current * tailsCanvasDPR
        );
        for (const dn of displayNotes.current) {
          if (!displayNikochan.current[dn.id]) {
            displayNikochan.current[dn.id] = new DisplayNikochan(
              notes[dn.id],
              dn,
              c
            );
          }
          const dns = displayNikochan.current[dn.id]!;
          dns.update(dn, c);
          shouldHideBPMSign ||= dns.shouldHideBPMSign;
          dns.drawNikochan(nctx);
          dns.drawTail(ctx);
          dns.drawRipple(ectx);
          dns.drawParticle(ectx);
        }
        lastNow.current = now;

        if (props.shouldHideBPMSign !== shouldHideBPMSign) {
          setTimeout(() => props.setShouldHideBPMSign(shouldHideBPMSign));
        }
      }
    } else {
      if (!noClear) {
        displayNotes.current = [];
        if (ctx) {
          ctx.clearRect(
            0,
            0,
            canvasWidth.current * tailsCanvasDPR,
            canvasHeight.current * tailsCanvasDPR
          );
        }
        if (nctx) {
          nctx.clearRect(
            0,
            0,
            canvasWidth.current * nikochanCanvasDPR.current,
            canvasHeight.current * nikochanCanvasDPR.current
          );
        }
        if (ectx) {
          ectx.clearRect(
            0,
            0,
            canvasWidth.current * effectsCanvasDPR,
            canvasHeight.current * effectsCanvasDPR
          );
        }
      }
      displayNikochan.current = [];
      if (props.shouldHideBPMSign !== false) {
        setTimeout(() => props.setShouldHideBPMSign(false));
      }
    }
  }

  const filteredStartTimeStampSample = useRef<number | null>(null);
  const rawStartTimeStampSample = useRef<number | null>(null);
  useEffect(() => {
    if (props.showTSOffset) {
      const i = setInterval(() => {
        rawStartTimeStampSample.current = props.rawStartTimeStamp.current;
        filteredStartTimeStampSample.current =
          props.filteredStartTimeStamp.current;
      }, 50);
      return () => clearInterval(i);
    }
  }, [
    props.showTSOffset,
    props.rawStartTimeStamp,
    props.filteredStartTimeStamp,
  ]);
  // rawStartTimeStampからoffsetとaudioを引けば -ytPlayer.current?.getCurrentTime() の値が残る
  const rawYTStartTimeStamp =
    rawStartTimeStampSample.current !== null && props.userOffset !== undefined
      ? (((rawStartTimeStampSample.current -
          props.userOffset * 1000 +
          (props.audioLatency || 0) * 1000) %
          1000) +
          1000) %
        1000
      : null;

  return (
    <div
      className={clsx(props.className, "overflow-visible")}
      style={props.style}
      ref={ref}
    >
      {/* For effects */}
      <canvas
        ref={effectsCanvasRef}
        className="absolute z-fw-canvas-effects pointer-events-none dark:opacity-70 opacity-90"
        style={{
          left: canvasLeft.current,
          top: canvasTop.current,
          width: canvasWidth.current,
          height: canvasHeight.current,
        }}
        width={canvasWidth.current * effectsCanvasDPR}
        height={canvasHeight.current * effectsCanvasDPR}
      />
      {/* For nikochans tail */}
      <canvas
        ref={tailsCanvasRef}
        className="absolute z-fw-canvas-tail pointer-events-none"
        style={{
          left: canvasLeft.current,
          top: canvasTop.current,
          width: canvasWidth.current,
          height: canvasHeight.current,
          opacity: 0.5,
        }}
        width={canvasWidth.current * tailsCanvasDPR}
        height={canvasHeight.current * tailsCanvasDPR}
      />
      {/* For nikochan */}
      <canvas
        ref={nikochanCanvasRef}
        className="absolute z-fw-canvas-nikochan pointer-events-none"
        style={{
          left: canvasLeft.current,
          top: canvasTop.current,
          width: canvasWidth.current,
          height: canvasHeight.current,
          /*
          Android16のChrome147でトップページにレンダリングしたcanvasが真っ黒になる+GPUのアーチファクトが出るというバグに遭遇したが、
          opacityを設定するとその謎現象を回避できることを発見。
          しかし0.999などあまり1に近い値だと効果がないっぽい?
          */
          opacity: 0.99,
        }}
        width={canvasWidth.current * nikochanCanvasDPR.current}
        height={canvasHeight.current * nikochanCanvasDPR.current}
      />
      {/* 判定線 */}
      {boxSize && marginY !== undefined && (
        <TargetLine
          className={clsx("z-fw-target-line", props.blur && "blur-2xs")}
          barFlash={
            props.barFlash === undefined || marginX === undefined
              ? undefined
              : "targetX" in props.barFlash
                ? props.barFlash.targetX * boxSize + marginX
                : props.barFlash.clientX
          }
          left={0}
          right="-100%"
          bottom={targetY * boxSize + marginY}
        />
      )}
      {boxSize && marginY !== undefined && props.showTSOffset && (
        <table
          className="absolute text-sm"
          style={{ bottom: targetY * boxSize + marginY, right: 0 }}
        >
          <tbody>
            <tr>
              <td className="flex-1">PosEst</td>
              <td colSpan={1} className="text-right">
                {(props.posOfs.current * 100).toFixed(2)}%
              </td>
              <td>/</td>
              <td colSpan={2} className="text-right">
                {props.timeOfsEstimator.current &&
                  (Math.sqrt(props.timeOfsEstimator.current.p) * 1000).toFixed(
                    2
                  )}
              </td>
            </tr>
            <tr>
              <td className="flex-1">TimeEst</td>
              <td colSpan={1} className="text-right">
                {props.timeOfsEstimator.current &&
                  (props.timeOfsEstimator.current.mu * 1000).toFixed(2)}
              </td>
              <td>/</td>
              <td colSpan={2} className="text-right">
                {props.timeOfsEstimator.current &&
                  (Math.sqrt(props.timeOfsEstimator.current.r) * 1000).toFixed(
                    2
                  )}
              </td>
            </tr>
            <tr>
              <td className="flex-1">User</td>
              <td className="min-w-14 text-right">
                {props.userOffset < 0 ? "-" : "+"}
                {Math.floor(Math.abs(props.userOffset) * 1000)}
              </td>
              <td>.</td>
              <td className="min-w-6">
                {(Math.floor(Math.abs(props.userOffset) * 1000 * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
              </td>
              <td>ms</td>
            </tr>
            <tr>
              <td>Audio</td>
              <td className="text-right">
                {typeof props.audioLatency === "number" &&
                  "-" + Math.floor(props.audioLatency * 1000)}
              </td>
              <td>.</td>
              <td>
                {typeof props.audioLatency === "number" &&
                  (Math.floor(props.audioLatency * 1000 * 100) % 100)
                    .toString()
                    .padStart(2, "0")}
              </td>
              <td>ms</td>
            </tr>
            <tr>
              <td>Raw%1s</td>
              <td className="text-right">
                {rawYTStartTimeStamp !== null &&
                  Math.floor(rawYTStartTimeStamp)}
              </td>
              <td>.</td>
              <td>
                {rawYTStartTimeStamp !== null &&
                  (Math.floor(rawYTStartTimeStamp * 100) % 100)
                    .toString()
                    .padStart(2, "0")}
              </td>
              <td>ms</td>
            </tr>
            <tr>
              <td>Filtered%1s</td>
              <td className="text-right">
                {filteredStartTimeStampSample.current !== null &&
                  Math.floor(filteredStartTimeStampSample.current) % 1000}
              </td>
              <td>.</td>
              <td>
                {filteredStartTimeStampSample.current !== null &&
                  (Math.floor(filteredStartTimeStampSample.current * 100) % 100)
                    .toString()
                    .padStart(2, "0")}
              </td>
              <td>ms</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
