"use client";

import clsx from "clsx/lite";
import {
  ChartSeqData,
  displayNote,
  NoteInGame,
  stepCmp,
  targetY,
} from "@falling-nikochan/chart";
import { useCallback, useEffect, useRef } from "react";
import { useCanvasProps } from "@/play/fallingWindow.js";
import { DisplayNikochan } from "@/play/displayNikochan.js";
import { useDisplayMode } from "@/scale.js";
import { useTheme } from "@/common/theme.js";
import { ChartEvent, getInspectCurrentStep } from "./clientPage.js";
import TargetLine from "@/common/targetLine.js";

interface Props {
  className?: string;
  style?: React.CSSProperties;
  chartSeq?: ChartSeqData;
  allEvents: readonly ChartEvent[];
  getCurrentTimeSec: () => number;
  playing: boolean;
  playbackRate?: number;
}

export default function InspectFallingWindow(props: Props) {
  const {
    chartSeq,
    allEvents,
    getCurrentTimeSec,
    playing,
    playbackRate = 1,
  } = props;

  const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
  const tailsCanvasRef = useRef<HTMLCanvasElement>(null);
  const nikochanCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    ref,
    canvasRect,
    canvasMarginX,
    canvasMarginY,
    marginY,
    noteSize,
    boxSize,
    dpr,
    fetchNikochanBitmap,
  } = useCanvasProps();

  // devicePixelRatioを無視するどころか、あえて小さくすることで、ぼかす
  const tailsCanvasDPR = Math.min(1, 6.5 / noteSize);
  const effectsCanvasDPR = 0.5;
  const nikochanCanvasDPR = dpr; /** (false ? 0.17 : 1)*/

  const { rem, playUIScale } = useDisplayMode();
  const { isDark } = useTheme();

  const nikochanBitmap = useRef<ImageBitmap[][] | null>(null);
  useEffect(() => {
    fetchNikochanBitmap(nikochanCanvasDPR).then((bitmaps) => {
      nikochanBitmap.current = bitmaps;
    });
  }, [fetchNikochanBitmap, nikochanCanvasDPR]);

  const displayNikochan = useRef<(DisplayNikochan | null)[]>([]);
  const lastNow = useRef<number>(0);

  // chartSeqの変更時または停止時に状態をリセット
  useEffect(() => {
    if (!playing) {
      displayNikochan.current = [];
    }
  }, [chartSeq, playing]);

  const renderCanvas = useCallback(
    (currentTimeSec: number) => {
      const ectx = effectsCanvasRef.current?.getContext("2d", {
        alpha: true,
        desynchronized: true,
      });
      const tctx = tailsCanvasRef.current?.getContext("2d", {
        alpha: true,
        desynchronized: true,
      });
      const nctx = nikochanCanvasRef.current?.getContext("2d", {
        alpha: true,
        desynchronized: true,
      });

      if (
        chartSeq &&
        marginY !== undefined &&
        canvasMarginX !== undefined &&
        canvasMarginY !== undefined &&
        boxSize &&
        nikochanBitmap.current
      ) {
        // Clear all canvases
        ectx?.clearRect(
          0,
          0,
          canvasRect.width * effectsCanvasDPR,
          canvasRect.height * effectsCanvasDPR
        );
        tctx?.clearRect(
          0,
          0,
          canvasRect.width * tailsCanvasDPR,
          canvasRect.height * tailsCanvasDPR
        );
        nctx?.clearRect(
          0,
          0,
          canvasRect.width * nikochanCanvasDPR,
          canvasRect.height * nikochanCanvasDPR
        );

        const currentStep = getInspectCurrentStep(
          chartSeq,
          allEvents,
          currentTimeSec
        );

        const c = {
          noteSize,
          boxSize,
          playUIScale,
          canvasMarginX,
          canvasMarginY,
          marginY,
          playbackRate,
          rem,
          now: playing ? currentTimeSec : undefined,
          nikochanBitmap: nikochanBitmap.current,
          lastNow: playing ? lastNow.current : undefined,
          dark: isDark,
          noFadeIn: playing ? false : true,
        };

        for (let ni = chartSeq.notes.length - 1; ni >= 0; ni--) {
          const n = chartSeq.notes[ni];
          const isHit = currentTimeSec >= n.hitTimeSec;
          const noteInGame: NoteInGame = {
            ...n,
            done: playing && isHit ? 1 : 0,
            bigDone: playing && isHit ? n.big : false,
            hitPos: playing && isHit ? { x: n.targetX, y: 0 } : undefined,
            chain: playing && isHit ? n.id + 1 : 0,
          };
          const dn = displayNote(noteInGame, currentTimeSec);
          if (dn !== null) {
            let dns: DisplayNikochan;
            if (playing) {
              if (!displayNikochan.current[dn.id]) {
                displayNikochan.current[dn.id] = new DisplayNikochan(
                  noteInGame,
                  dn,
                  c
                );
              }
              dns = displayNikochan.current[dn.id]!;
              dns.update(dn, c);
            } else {
              dns = new DisplayNikochan(noteInGame, dn, c);
            }

            const isSelected = stepCmp(n.step, currentStep) === 0;

            if (tctx) {
              if (playing) {
                dns.drawTail(tctx, tailsCanvasDPR);
              }
            }
            if (ectx) {
              if (!playing) {
                dns.drawTrail(
                  ectx,
                  effectsCanvasDPR,
                  isSelected
                    ? "oklch(80.8% 0.114 19.571)" // red-300
                    : "oklch(87.2% 0.01 258.338)" // gray-300
                );
              }
              if (playing) {
                dns.drawRipple(ectx, effectsCanvasDPR);
                dns.drawParticle(ectx, effectsCanvasDPR);
              }
            }
            if (nctx) {
              dns.drawNikochan(nctx, nikochanCanvasDPR);
              if (!playing && isSelected) {
                dns.drawCircle(
                  nctx,
                  nikochanCanvasDPR,
                  "oklch(70.4% 0.191 22.216)" // red-400
                );
              }
            }
          }
        }
        lastNow.current = currentTimeSec;
      }
    },
    [
      chartSeq,
      allEvents,
      canvasRect,
      boxSize,
      canvasMarginX,
      canvasMarginY,
      isDark,
      marginY,
      noteSize,
      playUIScale,
      rem,
      playing,
      playbackRate,
      effectsCanvasDPR,
      tailsCanvasDPR,
      nikochanCanvasDPR,
    ]
  );

  // 60fpsアニメーションループ
  useEffect(() => {
    let animFrame: ReturnType<typeof requestAnimationFrame>;
    const loop = () => {
      const time = getCurrentTimeSec();
      renderCanvas(time);
      animFrame = requestAnimationFrame(loop);
    };
    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [getCurrentTimeSec, renderCanvas]);

  return (
    <div className={props.className} style={props.style} ref={ref}>
      {/* For effects */}
      <canvas
        ref={effectsCanvasRef}
        className="absolute z-fw-canvas-effects pointer-events-none dark:opacity-70 opacity-90"
        style={{ ...canvasRect }}
        width={canvasRect.width * effectsCanvasDPR}
        height={canvasRect.height * effectsCanvasDPR}
      />
      {/* For nikochans tail */}
      <canvas
        ref={tailsCanvasRef}
        className="absolute z-fw-canvas-tail pointer-events-none"
        style={{
          ...canvasRect,
          opacity: 0.5,
        }}
        width={canvasRect.width * tailsCanvasDPR}
        height={canvasRect.height * tailsCanvasDPR}
      />
      {/* For nikochan */}
      <canvas
        ref={nikochanCanvasRef}
        className="absolute z-fw-canvas-nikochan pointer-events-none"
        style={{
          ...canvasRect,
          opacity: 0.99,
        }}
        width={canvasRect.width * nikochanCanvasDPR}
        height={canvasRect.height * nikochanCanvasDPR}
      />
      {/* 判定線 */}
      {boxSize && marginY !== undefined && (
        <TargetLine
          className={clsx("z-fw-target-line" /*false && "blur-2xs"*/)}
          barFlash={undefined}
          left={canvasRect.left}
          width={canvasRect.width}
          bottom={targetY * boxSize + marginY}
        />
      )}
    </div>
  );
}
