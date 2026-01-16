"use client";

import clsx from "clsx/lite";
import { memo, RefObject, useEffect, useRef, useState } from "react";
import { targetY, bigScale, bonusMax, Pos } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import { displayNote6, DisplayNote6, Note6 } from "@falling-nikochan/chart";
import { displayNote13, DisplayNote7, Note13 } from "@falling-nikochan/chart";
import { useTheme } from "@/common/theme";
import { useRealFPS } from "@/common/fpsCalculator";

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
  const realFps = useRealFPS();
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

  const nikochan0Bitmap = useRef<ImageBitmap | null>(null);
  const nikochan0BitmapBig = useRef<ImageBitmap | null>(null);
  useEffect(() => {
    (async () => {
      const res = await fetch(
        process.env.ASSET_PREFIX + `/assets/nikochan0.svg`
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
      img.decode().then(async () => {
        nikochan0Bitmap.current = await createImageBitmap(img, {
          resizeWidth: noteSize * nikochanCanvasDPR.current,
          resizeHeight: noteSize * nikochanCanvasDPR.current,
          resizeQuality: "high",
        });
      });
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
      imgBig.decode().then(async () => {
        nikochan0BitmapBig.current = await createImageBitmap(imgBig, {
          resizeWidth: noteSize * bigScale(true) * nikochanCanvasDPR.current,
          resizeHeight: noteSize * bigScale(true) * nikochanCanvasDPR.current,
          resizeQuality: "high",
        });
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteSize, nikochanCanvasDPR.current]);

  const displayNotes = useRef<DisplayNote6[] | DisplayNote7[]>([]);
  const noteFadeInStart = useRef<(DOMHighResTimeStamp | null)[]>([]);
  const tailVels = useRef<(Pos | null)[]>([]);
  useEffect(() => {
    if (playing) {
      while (notes.length >= tailVels.current.length) {
        tailVels.current.push(null);
      }
      while (notes.length >= noteFadeInStart.current.length) {
        noteFadeInStart.current.push(null);
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
      now !== undefined
    ) {
      displayNotes.current = notes
        .map((n) =>
          n.ver === 6 ? displayNote6(n, now) : displayNote13(n, now)
        )
        .filter((n) => n !== null);
      displayNotes.current.reverse(); // 奥に表示されるものが最初

      if (nctx) {
        nctx.clearRect(
          0,
          0,
          canvasWidth.current * nikochanCanvasDPR.current,
          canvasHeight.current * nikochanCanvasDPR.current
        );
        for (const dn of displayNotes.current) {
          const n = notes[dn.id];
          if (n.done > 0) {
            // 判定後のエフェクトについてはNikochanコンポーネント内のimgタグで描画する
            continue;
          }
          const size = noteSize * bigScale(n.big);
          const left = dn.pos.x * boxSize + canvasMarginX - size / 2;
          const top =
            canvasMarginY +
            boxSize -
            targetY * boxSize -
            dn.pos.y * boxSize -
            size / 2;
          const isOffScreen =
            left + size < 0 ||
            left - size > window.innerWidth ||
            top - size > canvasMarginY + boxSize ||
            top + size < 0;
          // 出現直後は100msのフェードインをする。
          // ただし最初から画面外にいるものについてはフェードインしない(開始時刻を-Infinityにすることで完了状態にする)
          if (noteFadeInStart.current[dn.id] === null) {
            if (isOffScreen) {
              noteFadeInStart.current[dn.id] = -Infinity;
            } else {
              noteFadeInStart.current[dn.id] = performance.now();
            }
          }
          nctx.globalAlpha =
            0.7 *
            Math.min(
              1,
              (performance.now() - noteFadeInStart.current[dn.id]!) / 100
            );
          if (n.big) {
            nctx.drawImage(
              nikochan0BitmapBig.current!,
              left * nikochanCanvasDPR.current,
              top * nikochanCanvasDPR.current
            );
          } else {
            nctx.drawImage(
              nikochan0Bitmap.current!,
              left * nikochanCanvasDPR.current,
              top * nikochanCanvasDPR.current
            );
          }
        }
      }
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          canvasWidth.current * tailsCanvasDPR,
          canvasHeight.current * tailsCanvasDPR
        );
        const headSize = noteSize * 1;
        const tailSize = noteSize * 0.85;
        const tailScaleFactor = 0.25;
        const tailTau = 0.2;
        const tailLambda = 0.15;
        function norm(xy: Pos) {
          return Math.sqrt(xy.x * xy.x + xy.y * xy.y);
        }
        for (const dn of displayNotes.current) {
          if (!tailVels.current[dn.id]) {
            tailVels.current[dn.id] = { x: 0, y: 0 };
          } else {
            const n = notes[dn.id];
            const tailVel = tailVels.current[dn.id]!;

            // 速度の変化が大きい場合に、細かく刻んで計算する
            const dtSplitNum = Math.max(
              1,
              Math.min(
                10,
                Math.round(
                  Math.abs(tailVels.current[dn.id]!.y - dn.vel.y) / 0.5
                )
              )
            );
            const dt = Math.max(0, now - lastNow.current) / dtSplitNum;
            function updateVelDamp(newVel: Pos) {
              // dv(移動距離)は速度が反転する瞬間などは0(追従を遅くする)になってほしいので、
              // x,yそれぞれ平均してから絶対値を取る
              const dv =
                norm({
                  x: (tailVel.x + newVel.x) / 2,
                  y: (tailVel.y + newVel.y) / 2,
                }) * dt;
              const velDamp = Math.exp(-dt / tailTau - dv / tailLambda);
              tailVel.x = tailVel.x * velDamp + newVel.x * (1 - velDamp);
              tailVel.y = tailVel.y * velDamp + newVel.y * (1 - velDamp);
            }

            for (let di = 1; di < dtSplitNum; di++) {
              const t = lastNow.current + dt * di;
              const newVel = (
                n.ver === 6 ? displayNote6(n, t) : displayNote13(n, t)
              )?.vel;
              if (newVel) {
                updateVelDamp(newVel);
              }
            }
            updateVelDamp(dn.vel);

            const log1pVelLength = Math.log1p(norm(tailVel));
            const tailLength =
              log1pVelLength *
              tailScaleFactor *
              boxSize *
              Math.sqrt(bigScale(n.big));
            const tailWidth = tailSize * bigScale(n.big);
            const tailOpacity = Math.min(1, log1pVelLength * 2);
            const velAngle = Math.atan2(-tailVel.y, tailVel.x);

            if (tailLength > noteSize / 2 && tailOpacity > 0.5) {
              ctx.save();
              ctx.scale(tailsCanvasDPR, tailsCanvasDPR);
              ctx.translate(
                dn.pos.x * boxSize + canvasMarginX,
                canvasMarginY + boxSize - targetY * boxSize - dn.pos.y * boxSize
              );
              ctx.rotate(velAngle);
              const tailGrad = ctx.createLinearGradient(tailLength, 0, 0, 0);
              tailGrad.addColorStop(0, "#facd0000");
              tailGrad.addColorStop(1, "#facd00cc");
              ctx.beginPath();
              ctx.moveTo(tailLength, 0);
              ctx.lineTo(0, -tailWidth / 2);
              ctx.lineTo(0, tailWidth / 2);
              ctx.closePath();
              ctx.fillStyle = tailGrad;
              // ctx.shadowBlur = 10;
              // ctx.shadowColor = "#facd0080";
              ctx.globalAlpha = tailOpacity;
              ctx.fill();
              ctx.restore();
            }

            if (
              n.done === 0 ||
              (tailLength > noteSize / 2 && tailOpacity > 0.5)
            ) {
              ctx.save();
              ctx.scale(tailsCanvasDPR, tailsCanvasDPR);
              ctx.translate(
                dn.pos.x * boxSize + canvasMarginX,
                canvasMarginY + boxSize - targetY * boxSize - dn.pos.y * boxSize
              );
              ctx.globalAlpha = n.done === 0 ? 1 : tailOpacity;
              ctx.beginPath();
              const headRadius = (headSize * bigScale(n.big)) / 2;
              ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
              const headGrad = ctx.createRadialGradient(
                0,
                0,
                0,
                0,
                0,
                headRadius
              );
              headGrad.addColorStop(0, "#ffe89dff");
              headGrad.addColorStop(0.5, "#ffe89dcc");
              headGrad.addColorStop(1, "#ffe89d00");
              ctx.fillStyle = headGrad;
              ctx.fill();
              ctx.restore();
            }
          }
        }
        lastNow.current = now;
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
      tailVels.current = [];
      noteFadeInStart.current = [];
    }
  }

  const nikochanAssets = useRef<string[]>([]);
  const particleAssets = useRef<string[]>([]);
  useEffect(() => {
    Promise.all(
      [0, 1, 2, 3].map((i) =>
        fetch(process.env.ASSET_PREFIX + `/assets/nikochan${i}.svg`)
          .then((res) => res.text())
          .then((text) => `data:image/svg+xml;base64,${btoa(text)}`)
      )
    ).then((urls) => {
      nikochanAssets.current = urls;
    });
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
          nikochanAssets={nikochanAssets}
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
  nikochanAssets: RefObject<string[]>;
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
      nikochanAssets={props.nikochanAssets}
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
  nikochanAssets: RefObject<string[]>;
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
  const [fadeoutStarted, setFadeoutStarted] = useState<boolean>(false);
  useEffect(() => {
    if (displayNote.done === 0) {
      setFadeoutStarted(false);
    }
    if (displayNote.done >= 1 && !fadeoutStarted) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          setFadeoutStarted(true);
        });
      });
    }
  }, [displayNote.done, fadeoutStarted]);
  return (
    <>
      <div
        className={clsx(
          "absolute",
          displayNote.done === 0
            ? "opacity-0"
            : !fadeoutStarted
              ? "dark:opacity-70 opacity-90"
              : clsx(
                  displayNote.done === 1 &&
                    "transition ease-linear duration-300 -translate-y-4 opacity-0 scale-125",
                  displayNote.done === 2 &&
                    "transition ease-linear duration-300 -translate-y-2 opacity-0",
                  displayNote.done === 3 &&
                    "transition ease-linear duration-300 opacity-0",
                  displayNote.done === 4 &&
                    "transition ease-linear duration-200 opacity-0"
                )
        )}
        style={{
          /* noteSize: にこちゃんのサイズ(boxSizeに対する比率), boxSize: 画面のサイズ */
          width: noteSize * bigScale(note.big),
          height: noteSize * bigScale(note.big),
          fontSize: noteSize * bigScale(note.big), // 1em で参照できるように
          left:
            (displayNote.done === 0 ? note.targetX : displayNote.pos.x) *
              boxSize -
            (noteSize * bigScale(note.big)) / 2 +
            marginX,
          bottom:
            (displayNote.done === 0 ? targetY : displayNote.pos.y) * boxSize +
            targetY * boxSize -
            (noteSize * bigScale(note.big)) / 2 +
            marginY,
          willChange: "transform, opacity, left, bottom",
        }}
      >
        <img
          decoding="async"
          src={
            props.nikochanAssets.current[
              displayNote.done <= 3 ? displayNote.done : 0
            ]
          }
          className="absolute inset-0 w-full h-full opacity-70"
        />
        {/* chainBonusをにこちゃんの右上に表示する */}
        {/*{displayNote.baseScore !== undefined &&
          displayNote.chainBonus !== undefined &&
          displayNote.chain && (
            <span
              className={clsx(
               "absolute w-12 text-xs",
                (displayNote.chain >= 100 || displayNote.bigDone) && "text-orange-500"
              )}
              style={{ bottom: "100%", left: "100%" }}
            >
              ×{" "}
              {(
                displayNote.baseScore +
                displayNote.chainBonus +
                (displayNote.bigBonus || 0)
              ).toFixed(2)}
            </span>
          )}*/}
      </div>
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
