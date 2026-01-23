"use client";

import clsx from "clsx/lite";
import { memo, RefObject, useEffect, useRef, useState } from "react";
import { targetY, bigScale, bonusMax } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import { displayNote6, DisplayNote6, Note6 } from "@falling-nikochan/chart";
import { displayNote13, DisplayNote7, Note13 } from "@falling-nikochan/chart";
import { useTheme } from "@/common/theme";
import { useRealFPS } from "@/common/fpsCalculator";
import { DisplayNikochan } from "./displayNikochan";

interface Props {
  className?: string;
  style?: object;
  notes: Note6[] | Note13[];
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  setRunFPS: (fps: number) => void;
  setRenderFPS: (fps: number) => void;
  barFlash: FlashPos;
  noClear: boolean;
  playbackRate: number;
  setShouldHideBPMSign: (hide: boolean) => void;
  shouldHideBPMSign: boolean;
}
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
  const canvasLeft = useRef<number>(0);
  const canvasTop = useRef<number>(0);
  const canvasWidth = useRef<number>(0);
  const canvasHeight = useRef<number>(0);
  useEffect(() => {
    if (ref.current && marginX !== undefined && marginY !== undefined) {
      canvasLeft.current = -(
        ref.current as HTMLDivElement
      ).getBoundingClientRect().left;
      canvasTop.current = -(
        ref.current as HTMLDivElement
      ).getBoundingClientRect().top;
      canvasWidth.current = window.innerWidth;
      canvasHeight.current = window.innerHeight;
    }
  }, [ref, marginX, marginY]);
  const canvasMarginX =
    marginX !== undefined ? -canvasLeft.current + marginX : undefined;
  const canvasMarginY =
    marginY !== undefined ? -canvasTop.current + marginY : undefined;

  const { isDark } = useTheme();
  const { rem } = useDisplayMode();
  const noteSize = Math.max(1.5 * rem, 0.06 * (boxSize || 0));

  // devicePixelRatioを無視するどころか、あえて小さくすることで、ぼかす
  const tailsCanvasDPR = Math.min(1, 6.5 / noteSize);
  const nikochanCanvasDPR = useRef<number>(1);
  useEffect(() => {
    nikochanCanvasDPR.current = window.devicePixelRatio;
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
          console.log("large delay:", nowMs);
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

  const nikochanBitmap = useRef<ImageBitmap[][] | null>(null); // nikochanBitmap.current[0-3][big:0|1]
  useEffect(() => {
    Promise.all(
      [0, 1, 2, 3].map(async (i) => {
        const res = await fetch(
          process.env.ASSET_PREFIX + `/assets/nikochan${i}.svg`
        );
        const svg = await res.text();
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

  const displayNotes = useRef<DisplayNote6[] | DisplayNote7[]>([]);
  const displayNikochan = useRef<(DisplayNikochan | null)[]>([]);
  useEffect(() => {
    if (playing) {
      while (notes.length >= displayNikochan.current.length) {
        displayNikochan.current.push(null);
      }
    }
  }, [playing, notes]);
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
        canvasMarginX,
        canvasMarginY,
        marginY,
        playbackRate,
        rem,
        now,
        tailsCanvasDPR,
        nikochanCanvasDPR: nikochanCanvasDPR.current,
        nikochanBitmap: nikochanBitmap.current,
        lastNow: lastNow.current,
      };

      displayNotes.current = notes
        .map((n) =>
          n.ver === 6 ? displayNote6(n, now) : displayNote13(n, now)
        )
        .filter((n) => n !== null);
      displayNotes.current.reverse(); // 奥に表示されるものが最初

      if (nctx && ctx) {
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
      }
      displayNikochan.current = [];
      if (props.shouldHideBPMSign !== false) {
        setTimeout(() => props.setShouldHideBPMSign(false));
      }
    }
  }

  const particleAssets = useRef<string[]>([]);
  useEffect(() => {
    Promise.all(
      Array.from(new Array(13)).map((_, i) =>
        [4, 6, 8, 10, 12].includes(i)
          ? fetch(process.env.ASSET_PREFIX + `/assets/particle${i}.svg`)
              .then((res) => res.text())
              .then((text) => `data:image/svg+xml;base64,${btoa(text)}`)
          : ""
      )
    ).then((urls) => {
      particleAssets.current = urls;
    });
  }, []);

  return (
    <div
      className={clsx(props.className, "overflow-visible")}
      style={props.style}
      ref={ref}
    >
      {/* For nikochans tail */}
      <canvas
        ref={tailsCanvasRef}
        style={{
          zIndex: -7,
          position: "absolute",
          left: canvasLeft.current,
          top: canvasTop.current,
          width: canvasWidth.current,
          height: canvasHeight.current,
          pointerEvents: "none",
          opacity: isDark ? 0.5 : 0.5,
        }}
        width={canvasWidth.current * tailsCanvasDPR}
        height={canvasHeight.current * tailsCanvasDPR}
      />
      {/* For nikochan */}
      <canvas
        ref={nikochanCanvasRef}
        style={{
          zIndex: 0,
          position: "absolute",
          left: canvasLeft.current,
          top: canvasTop.current,
          width: canvasWidth.current,
          height: canvasHeight.current,
          pointerEvents: "none",
          opacity: isDark ? 0.7 : 0.9,
        }}
        width={canvasWidth.current * nikochanCanvasDPR.current}
        height={canvasHeight.current * nikochanCanvasDPR.current}
      />
      {/* 判定線 */}
      {boxSize && marginY !== undefined && (
        <TargetLine
          className="-z-3"
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
      {boxSize && marginX !== undefined && marginY !== undefined && (
        <NikochansMemo
          displayNotes={displayNotes.current}
          notes={notes}
          noteSize={noteSize}
          boxSize={boxSize}
          marginX={marginX}
          marginY={marginY}
          particleAssets={particleAssets}
        />
      )}
    </div>
  );
}

interface MProps {
  displayNotes: DisplayNote6[] | DisplayNote7[];
  notes: Note6[] | Note13[];
  noteSize: number;
  boxSize: number;
  marginX: number;
  marginY: number;
  particleAssets: RefObject<string[]>;
}
const NikochansMemo = memo(function Nikochans(props: MProps) {
  return props.displayNotes.map((d) => (
    <Nikochan
      key={d.id}
      displayNote={d}
      note={props.notes[d.id]}
      noteSize={props.noteSize}
      marginX={props.marginX}
      marginY={props.marginY}
      boxSize={props.boxSize}
      particleAssets={props.particleAssets}
    />
  ));
});

interface NProps {
  displayNote: DisplayNote6 | DisplayNote7;
  noteSize: number;
  note: Note6 | Note13;
  marginX: number;
  marginY: number;
  boxSize: number;
  particleAssets: RefObject<string[]>;
}
function Nikochan(props: NProps) {
  /* にこちゃん
  d.done に応じて画像と動きを変える
  0: 通常
  1〜3: good, ok, bad
  4: miss は画像が0と同じ
  */
  const { displayNote, noteSize, marginX, marginY, boxSize, note } = props;
  return (
    <>
      {[1].includes(displayNote.done) && (
        <Ripple
          noteSize={noteSize}
          left={note.targetX * boxSize + marginX}
          bottom={targetY * boxSize + marginY}
          big={displayNote.bigDone}
          chain={displayNote.chain || 0}
        />
      )}
      {displayNote.chain && [1, 2].includes(displayNote.done) && (
        <Particle
          particleNum={
            // 6,8,10,12
            6 + Math.floor(3 * Math.min(1, displayNote.chain / bonusMax)) * 2
          }
          left={note.targetX * boxSize + marginX}
          bottom={targetY * boxSize + marginY}
          noteSize={noteSize}
          big={!!displayNote.bigBonus}
          chain={displayNote.chain || 0}
          particleAssets={props.particleAssets}
        />
      )}
    </>
  );
}

interface RProps {
  noteSize: number;
  left: number;
  bottom: number;
  big: boolean;
  chain: number;
}
function Ripple(props: RProps) {
  const ref = useRef<HTMLDivElement>(null!);
  const ref2 = useRef<HTMLDivElement>(null!);
  const animateDone = useRef<boolean>(false);
  const { noteSize } = props;
  const rippleWidth = noteSize * 2.5 * (props.big ? 1.5 : 1);
  const rippleHeight = rippleWidth * 0.7;
  useEffect(() => {
    if (!animateDone.current) {
      [ref, ref2].forEach((r, i) => {
        r.current.animate(
          [
            { transform: "scale(0)", opacity: 0.5 },
            { transform: "scale(0.8)", opacity: 0.5, offset: 0.8 },
            { transform: `scale(1)`, opacity: 0 },
          ],
          {
            duration: 350 - 200 * i,
            delay: 200 * i,
            fill: "forwards",
            easing: "ease-out",
          }
        );
      });
    }
    animateDone.current = true;
  }, [noteSize]);
  return (
    <div
      className="absolute -z-20 dark:opacity-70 opacity-90"
      style={{
        width: 1,
        height: 1,
        left: props.left,
        bottom: props.bottom,
      }}
    >
      {[ref, ref2].map((r, i) => (
        <div
          key={i}
          ref={r}
          className={clsx(
            "absolute origin-center opacity-0",
            props.chain >= bonusMax
              ? "bg-amber-300 border-amber-400/70 dark:bg-yellow-500 dark:border-yellow-400/70"
              : "bg-yellow-200 border-yellow-300/70 dark:bg-amber-600 dark:border-amber-500/70"
          )}
          style={{
            borderWidth: rippleWidth / 20,
            borderRadius: "50%",
            width: rippleWidth,
            height: rippleHeight,
            left: -rippleWidth / 2,
            bottom: -rippleHeight / 2,
          }}
        />
      ))}
    </div>
  );
}

interface PProps {
  particleNum: number;
  left: number;
  bottom: number;
  noteSize: number;
  big: boolean;
  chain: number;
  particleAssets: RefObject<string[]>;
}
function Particle(props: PProps) {
  const ref = useRef<HTMLImageElement>(null!);
  const refBig = useRef<HTMLImageElement | null>(null);
  const animateDone = useRef<boolean>(false);
  const bigAnimateDone = useRef<boolean>(false);
  const { noteSize, particleNum } = props;
  const maxSize = noteSize * 2;
  const bigSize = noteSize * 3.5;
  useEffect(() => {
    if (!animateDone.current) {
      const angle = Math.random() * 360;
      const angleVel = Math.random() * 120 - 60;
      ref.current.animate(
        [
          { transform: `scale(0.3) rotate(${angle}deg)`, opacity: 0 },
          {
            transform: `scale(0.8) rotate(${angle + angleVel * 0.8}deg)`,
            opacity: 0.8,
            offset: 0.8,
          },
          { transform: `scale(1) rotate(${angle + angleVel}deg)`, opacity: 0 },
        ],
        { duration: 500, fill: "forwards", easing: "ease-out" }
      );
      animateDone.current = true;
    }
    if (props.big && refBig.current && !bigAnimateDone.current) {
      const angleBig = Math.random() * 360;
      const angleVel = Math.random() * 120 - 60;
      refBig.current?.animate(
        [
          { transform: `scale(0.3) rotate(${angleBig}deg)`, opacity: 0 },
          {
            transform: `scale(0.8) rotate(${angleBig + angleVel * 0.8}deg)`,
            opacity: 0.6,
            offset: 0.8,
          },
          {
            transform: `scale(1) rotate(${angleBig + angleVel}deg)`,
            opacity: 0,
          },
        ],
        { duration: 500, fill: "forwards", easing: "ease-out" }
      );
      bigAnimateDone.current = true;
    }
  }, [props.big]);

  return (
    <div
      className="absolute -z-10 dark:opacity-70 opacity-90"
      style={{
        width: 1,
        height: 1,
        left: props.left,
        bottom: props.bottom,
      }}
    >
      <img
        decoding="async"
        src={props.particleAssets.current[particleNum]}
        ref={ref}
        className="absolute opacity-0"
        style={{
          left: -maxSize / 2,
          bottom: -maxSize / 2,
          width: maxSize,
          minWidth: maxSize, // なぜかこれがないとwidthが0になってしまう...
          height: maxSize,
          minHeight: maxSize,
        }}
      />
      {props.big && (
        <img
          decoding="async"
          src={props.particleAssets.current[particleNum - 2]}
          ref={refBig}
          className="absolute opacity-0"
          style={{
            left: -bigSize / 2,
            bottom: -bigSize / 2,
            width: bigSize,
            minWidth: bigSize,
            height: bigSize,
            minHeight: bigSize,
          }}
        />
      )}
    </div>
  );
}
