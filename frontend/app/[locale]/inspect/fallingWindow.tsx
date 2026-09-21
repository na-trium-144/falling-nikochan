"use client";

import clsx from "clsx/lite";
import {
  ChartSeqData,
  displayNote,
  DisplayNote,
  getStep,
  stepCmp,
  targetY,
} from "@falling-nikochan/chart";
import { useCallback, useEffect, useRef } from "react";
import { useCanvasProps } from "@/play/fallingWindow.js";
import { DisplayNikochan } from "@/play/displayNikochan.js";
import { useDisplayMode } from "@/scale.js";
import { useTheme } from "@/common/theme.js";

interface Props {
  className?: string;
  style?: React.CSSProperties;
  chartSeq?: ChartSeqData;
  getCurrentTimeSec: () => number;
}

export default function InspectFallingWindow(props: Props) {
  const { chartSeq, getCurrentTimeSec } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const { rem, playUIScale } = useDisplayMode();
  const { isDark } = useTheme();

  const nikochanBitmap = useRef<ImageBitmap[][] | null>(null);
  useEffect(() => {
    fetchNikochanBitmap(dpr).then((bitmaps) => {
      nikochanBitmap.current = bitmaps;
    });
  }, [fetchNikochanBitmap, dpr]);

  const renderCanvas = useCallback(
    (currentTimeSec: number) => {
      const ctx = canvasRef.current?.getContext("2d", {
        alpha: true,
        desynchronized: true,
      });
      if (
        ctx &&
        chartSeq &&
        marginY !== undefined &&
        canvasMarginX !== undefined &&
        canvasMarginY !== undefined &&
        boxSize &&
        nikochanBitmap.current
      ) {
        const c = {
          noteSize,
          boxSize,
          playUIScale,
          canvasMarginX,
          canvasMarginY,
          marginY,
          rem,
          nikochanBitmap: nikochanBitmap.current,
          dark: isDark,
          noFadeIn: true,
        };

        ctx.clearRect(0, 0, canvasRect.width * dpr, canvasRect.height * dpr);

        const currentStep = getStep(chartSeq.bpmChanges, currentTimeSec, 192);

        const notesInGame = chartSeq.notes.map((n) => ({
          ...n,
          bigDone: false,
          done: 0,
        }));

        const displayNotes: DisplayNote[] = [];
        for (let ni = 0; ni < notesInGame.length; ni++) {
          const dn = displayNote(notesInGame[ni], currentTimeSec);
          if (dn !== null) {
            displayNotes.push(dn);
          }
        }
        displayNotes.reverse();

        const displayNikochan = displayNotes.map(
          (dn) => new DisplayNikochan(notesInGame[dn.id], dn, c)
        );

        // 軌跡を描画
        displayNikochan.forEach((d) => {
          const note = chartSeq.notes[d.dn.id];
          const isSelected =
            Math.abs(note.hitTimeSec - currentTimeSec) < 0.005 ||
            stepCmp(note.step, currentStep) === 0;
          d.drawTrail(
            ctx,
            dpr,
            isSelected
              ? "oklch(80.8% 0.114 19.571)" // red-300
              : "oklch(87.2% 0.01 258.338)" // gray-300
          );
        });

        // ニコちゃんを描画
        displayNikochan.forEach((d) => d.drawNikochan(ctx, dpr));

        // 選択中のみ赤丸を描画
        displayNikochan.forEach((d) => {
          const note = chartSeq.notes[d.dn.id];
          const isSelected =
            Math.abs(note.hitTimeSec - currentTimeSec) < 0.005 ||
            stepCmp(note.step, currentStep) === 0;
          if (isSelected) {
            d.drawCircle(ctx, dpr, "oklch(70.4% 0.191 22.216)"); // red-400
          }
        });
      }
    },
    [
      chartSeq,
      canvasRect,
      dpr,
      boxSize,
      canvasMarginX,
      canvasMarginY,
      isDark,
      marginY,
      noteSize,
      playUIScale,
      rem,
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
      className={clsx("relative w-full h-full", props.className)}
      style={props.style}
      ref={ref}
    >
      <canvas
        ref={canvasRef}
        className="absolute z-play-fw pointer-events-none"
        style={{
          ...canvasRect,
        }}
        width={canvasRect.width * dpr}
        height={canvasRect.height * dpr}
      />
      {/* 判定線 */}
      {boxSize && marginY !== undefined && (
        <div
          className={clsx(
            "z-play-fw",
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
