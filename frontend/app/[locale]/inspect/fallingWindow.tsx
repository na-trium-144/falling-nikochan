"use client";

import clsx from "clsx/lite";
import {
  ChartSeqData,
  displayNote,
  DisplayNote,
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

  const effectsCanvasDPR = Math.min(2, dpr);
  const tailsCanvasDPR = Math.min(2, dpr);
  const nikochanCanvasDPR = dpr;

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
    displayNikochan.current = [];
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

        if (playing) {
          // 巻き戻し/シークを検知して未来の音符のアニメーション状態をリセット
          if (currentTimeSec < lastNow.current) {
            for (let ni = 0; ni < chartSeq.notes.length; ni++) {
              if (chartSeq.notes[ni].hitTimeSec > currentTimeSec) {
                displayNikochan.current[ni] = null;
              }
            }
          }

          const c = {
            noteSize,
            boxSize,
            playUIScale,
            canvasMarginX,
            canvasMarginY,
            marginY,
            playbackRate,
            rem,
            now: currentTimeSec,
            nikochanBitmap: nikochanBitmap.current,
            lastNow: lastNow.current,
            dark: isDark,
            noFadeIn: false,
          };

          const displayNotes: DisplayNote[] = [];
          for (let ni = 0; ni < chartSeq.notes.length; ni++) {
            const n = chartSeq.notes[ni];
            const isHit = currentTimeSec >= n.hitTimeSec;
            const noteInGame: NoteInGame = {
              ...n,
              done: isHit ? 1 : 0,
              bigDone: isHit ? n.big : false,
              hitPos: isHit ? { x: n.targetX, y: 0 } : undefined,
              chain: isHit ? n.id + 1 : 0,
            };
            const dn = displayNote(noteInGame, currentTimeSec);
            if (dn !== null) {
              displayNotes.push(dn);
            }
          }
          displayNotes.reverse();

          for (const dn of displayNotes) {
            const note = chartSeq.notes[dn.id];
            const isHit = currentTimeSec >= note.hitTimeSec;
            const noteInGame: NoteInGame = {
              ...note,
              done: isHit ? 1 : 0,
              bigDone: isHit ? note.big : false,
              hitPos: isHit ? { x: note.targetX, y: 0 } : undefined,
              chain: isHit ? note.id + 1 : 0,
            };

            if (!displayNikochan.current[dn.id]) {
              displayNikochan.current[dn.id] = new DisplayNikochan(
                noteInGame,
                dn,
                c
              );
            }
            const dns = displayNikochan.current[dn.id]!;
            dns.update(dn, c);

            const isSelected = stepCmp(note.step, currentStep) === 0;

            if (tctx) {
              dns.drawTrail(
                tctx,
                tailsCanvasDPR,
                isSelected
                  ? "oklch(80.8% 0.114 19.571)" // red-300
                  : "oklch(87.2% 0.01 258.338)" // gray-300
              );
              dns.drawTail(tctx, tailsCanvasDPR);
            }
            if (ectx) {
              dns.drawRipple(ectx, effectsCanvasDPR);
              dns.drawParticle(ectx, effectsCanvasDPR);
            }
            if (nctx) {
              dns.drawNikochan(nctx, nikochanCanvasDPR);
              if (isSelected) {
                dns.drawCircle(
                  nctx,
                  nikochanCanvasDPR,
                  "oklch(70.4% 0.191 22.216)" // red-400
                );
              }
            }
          }
          lastNow.current = currentTimeSec;
        } else {
          // 停止中: アニメーション状態はリセットし、Tail, Ripple, Particleは描画しない
          displayNikochan.current = [];

          const c = {
            noteSize,
            boxSize,
            playUIScale,
            canvasMarginX,
            canvasMarginY,
            marginY,
            playbackRate,
            rem,
            nikochanBitmap: nikochanBitmap.current,
            dark: isDark,
            noFadeIn: true,
          };

          const displayNotes: DisplayNote[] = [];
          for (let ni = 0; ni < chartSeq.notes.length; ni++) {
            const n = chartSeq.notes[ni];
            const noteInGame: NoteInGame = {
              ...n,
              done: 0,
              bigDone: false,
              chain: 0,
            };
            const dn = displayNote(noteInGame, currentTimeSec);
            if (dn !== null) {
              displayNotes.push(dn);
            }
          }
          displayNotes.reverse();

          for (const dn of displayNotes) {
            const note = chartSeq.notes[dn.id];
            const noteInGame: NoteInGame = {
              ...note,
              done: 0,
              bigDone: false,
              chain: 0,
            };
            const dns = new DisplayNikochan(noteInGame, dn, c);
            const isSelected = stepCmp(note.step, currentStep) === 0;

            if (tctx) {
              dns.drawTrail(
                tctx,
                tailsCanvasDPR,
                isSelected
                  ? "oklch(80.8% 0.114 19.571)" // red-300
                  : "oklch(87.2% 0.01 258.338)" // gray-300
              );
            }
            if (nctx) {
              dns.drawNikochan(nctx, nikochanCanvasDPR);
              if (isSelected) {
                dns.drawCircle(
                  nctx,
                  nikochanCanvasDPR,
                  "oklch(70.4% 0.191 22.216)" // red-400
                );
              }
            }
          }
          lastNow.current = currentTimeSec;
        }
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
    <div
      className={clsx("relative isolate w-full h-full", props.className)}
      style={props.style}
      ref={ref}
    >
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
        <div
          className={clsx(
            "z-fw-target-line",
            "absolute h-0.5 transition duration-100",
            "bg-gray-400 shadow-none pointer-events-none"
          )}
          style={{
            left: 0,
            right: 0,
            bottom: targetY * boxSize + marginY,
          }}
        />
      )}
    </div>
  );
}
