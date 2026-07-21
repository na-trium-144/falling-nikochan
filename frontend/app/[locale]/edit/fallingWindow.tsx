"use client";

import clsx from "clsx/lite";
import {
  DisplayNote,
  targetY,
  bigScale,
  displayNote,
  ChartEditing,
  NoteCommandWithLua,
} from "@falling-nikochan/chart";
import Arrow from "./arrow.js";
import DragHandle from "./dragHandle.js";
import { useDisplayMode } from "@/scale.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvasProps } from "@/play/fallingWindow.js";
import { DisplayNikochan } from "@/play/displayNikochan.js";
import { useTheme } from "@/common/theme.js";

interface Props {
  className?: string;
  style?: object;
  chart?: ChartEditing;
  dragMode: null | "p" | "v" | "a";
  setDragMode: (mode: null | "p" | "v" | "a") => void;
  inCodeTab: boolean;
}

export default function FallingWindow(props: Props) {
  const { chart, dragMode } = props;
  const currentLevel = chart?.currentLevel;
  const cur = currentLevel?.current;

  const {
    ref,
    canvasRect,
    canvasMarginX,
    canvasMarginY,
    marginX,
    marginY,
    noteSize,
    boxSize,
    dpr,
    fetchNikochanBitmap,
  } = useCanvasProps();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { rem, playUIScale } = useDisplayMode();
  const { isDark } = useTheme();

  // const [displayNotes, setDisplayNotes] = useState<DisplayNote[]>([]);
  const displayNotesRef = useRef<DisplayNote[]>([]);

  const [pendingNoteUpdate, setPendingNoteUpdate] =
    useState<NoteCommandWithLua | null>(null);
  const currentNote: NoteCommandWithLua | undefined =
    pendingNoteUpdate || currentLevel?.currentNote;

  const nikochanBitmap = useRef<ImageBitmap[][] | null>(null); // nikochanBitmap.current[0-3][big:0|1]
  useEffect(() => {
    fetchNikochanBitmap(dpr).then((bitmaps) => {
      nikochanBitmap.current = bitmaps;
    });
  }, [fetchNikochanBitmap, dpr]);

  const rerenderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rerenderCanvas = useCallback(() => {
    rerenderTimeoutRef.current = null;
    const ctx = canvasRef.current?.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });
    if (
      ctx &&
      cur &&
      currentLevel &&
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
      const displayNikochan = displayNotesRef.current.map(
        (dn) => new DisplayNikochan(currentLevel.seqNotes[dn.id], dn, c)
      );
      displayNikochan.forEach((d) =>
        d.drawTrail(
          ctx,
          dpr,
          d.dn.id === cur.noteIndex
            ? "oklch(80.8% 0.114 19.571)" // red-300
            : "oklch(87.2% 0.01 258.338)" // gray-300
        )
      );
      displayNikochan.forEach((d) =>
        d.drawCircle(
          ctx,
          dpr,
          null,
          d.dn.id === cur.noteIndex
            ? "oklch(70.4% 0.191 22.216)" // red-400
            : "oklch(85.2% 0.199 91.936)" // yellow-400
        )
      );
    }
  }, [
    canvasRect,
    currentLevel,
    cur,
    dpr,
    boxSize,
    canvasMarginX,
    canvasMarginY,
    isDark,
    marginY,
    noteSize,
    playUIScale,
    rem,
  ]);

  useEffect(() => {
    const updateDisplayNotes = () => {
      const displayNotes: DisplayNote[] = [];
      if (currentLevel && cur) {
        for (let ni = 0; ni < currentLevel.seqNotes.length; ni++) {
          const dn = displayNote(currentLevel.seqNotes[ni], cur.timeSec);
          if (dn !== null) {
            displayNotes.push(dn);
          }
        }
      }
      displayNotes.reverse();
      // setDisplayNotes(displayNotes);
      displayNotesRef.current = displayNotes;
      if (rerenderTimeoutRef.current === null) {
        rerenderTimeoutRef.current = setTimeout(rerenderCanvas, 30);
      }
    };
    updateDisplayNotes();
    chart?.on("rerender", updateDisplayNotes);
    return () => {
      chart?.off("rerender", updateDisplayNotes);
    };
  }, [boxSize, cur, currentLevel, chart, rerenderCanvas]);

  return (
    <div className={clsx(props.className)} style={props.style} ref={ref}>
      <div className="relative w-full h-full overflow-visible">
        <canvas
          ref={canvasRef}
          className="absolute z-edit-nikochan pointer-events-none"
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
              "z-edit-target-line",
              "absolute h-0.5 transition duration-100",
              "bg-gray-400 shadow-none"
            )}
            style={{
              left: 0,
              right: 0,
              bottom: targetY * boxSize + marginY,
            }}
          />
        )}
        {currentNote &&
          boxSize &&
          marginX !== undefined &&
          marginY !== undefined &&
          currentLevel?.currentNoteEditable &&
          !props.inCodeTab && (
            <>
              {pendingNoteUpdate && (
                <div
                  className="absolute rounded-full border-2 border-yellow-500 z-edit-nikochan"
                  style={{
                    width: noteSize * bigScale(pendingNoteUpdate.big),
                    height: noteSize * bigScale(pendingNoteUpdate.big),
                    left:
                      ((pendingNoteUpdate.hitX + 5) / 10) * boxSize -
                      (noteSize * bigScale(pendingNoteUpdate.big)) / 2 +
                      marginX,
                    bottom:
                      targetY * boxSize -
                      (noteSize * bigScale(pendingNoteUpdate.big)) / 2 +
                      marginY,
                  }}
                />
              )}
              {/* xを左右に動かす矢印 */}
              {dragMode === "p" ? (
                <>
                  <Arrow
                    left={
                      ((currentNote.hitX + 5) / 10) * boxSize +
                      marginX -
                      (0.12 * boxSize + noteSize / 2)
                    }
                    bottom={targetY * boxSize + marginY}
                    length={0.1 * boxSize}
                    lineWidth={12}
                    rotation={0}
                  />
                  <Arrow
                    left={
                      ((currentNote.hitX + 5) / 10) * boxSize +
                      marginX +
                      (0.12 * boxSize + noteSize / 2)
                    }
                    bottom={targetY * boxSize + marginY}
                    length={0.1 * boxSize}
                    lineWidth={12}
                    rotation={Math.PI}
                  />
                  <DragHandle
                    className="absolute inset-0"
                    onMove={(_x, _y, cx /*, cy*/) => {
                      const winLeft = ref.current.getBoundingClientRect().left;
                      // const winBottom = ref.current.getBoundingClientRect().bottom;
                      // cx-winLeft, winBottom-cy が divのabsolute基準からマウスカーソル位置までの相対位置になる
                      setPendingNoteUpdate({
                        ...currentNote,
                        hitX: Math.round(
                          ((cx - winLeft - marginX) * 10) / boxSize - 5
                        ),
                      });
                    }}
                    onMoveEnd={() => {
                      if (pendingNoteUpdate) {
                        currentLevel?.updateNote(pendingNoteUpdate);
                        setPendingNoteUpdate(null);
                      }
                    }}
                  />
                </>
              ) : dragMode === "v" ? (
                <>
                  {/* vx,vyを動かす矢印 */}
                  <Arrow
                    left={((currentNote.hitX + 5) / 10) * boxSize + marginX}
                    bottom={targetY * boxSize + marginY}
                    length={
                      (Math.sqrt(
                        Math.pow(currentNote.hitVX, 2) +
                          Math.pow(currentNote.hitVY, 2)
                      ) *
                        boxSize) /
                      4
                    }
                    lineWidth={12}
                    rotation={-Math.atan2(currentNote.hitVY, currentNote.hitVX)}
                  />
                  <DragHandle
                    className="absolute inset-0"
                    onMove={(_x, _y, cx, cy) => {
                      const winLeft = ref.current.getBoundingClientRect().left;
                      const winBottom =
                        ref.current.getBoundingClientRect().bottom;
                      const originLeft =
                        ((currentNote.hitX + 5) / 10) * boxSize + marginX;
                      const originBottom = targetY * boxSize + marginY - 16;
                      // cx-winLeft, winBottom-cy が divのabsolute基準からマウスカーソル位置までの相対位置になる

                      // 音符位置からマウスまでの距離
                      const mouseVX = (cx - winLeft - originLeft) / boxSize;
                      const mouseVY = (winBottom - cy - originBottom) / boxSize;
                      // const mouseDist = Math.sqrt(
                      //   Math.pow(mouseVX, 2) + Math.pow(mouseVY, 2)
                      // );
                      // const hitVDist = Math.sqrt(
                      //   Math.pow(
                      //     currentLevel.notes[currentNoteIndex].hitVX,
                      //     2
                      //   ) +
                      //     Math.pow(
                      //       currentLevel.notes[currentNoteIndex].hitVY,
                      //       2
                      //     )
                      // );
                      // console.log(
                      //   mouseVY,
                      //   currentLevel.notes[currentNoteIndex].hitVY
                      // );
                      setPendingNoteUpdate({
                        ...currentNote,
                        hitVX: Math.round(mouseVX * 4),
                        hitVY: Math.round(mouseVY * 4),
                      });
                    }}
                    onMoveEnd={() => {
                      if (pendingNoteUpdate) {
                        currentLevel?.updateNote(pendingNoteUpdate);
                        setPendingNoteUpdate(null);
                      }
                    }}
                  />
                </>
              ) : (
                <div
                  className="absolute inset-0 z-edit-drag-overlay"
                  onPointerDown={(e) => {
                    // touch環境でマウスを使ってクリックしようとしたときモードをリセットする
                    if (e.pointerType === "mouse") {
                      props.setDragMode("p");
                    }
                  }}
                />
              )}
            </>
          )}
      </div>
    </div>
  );
}
