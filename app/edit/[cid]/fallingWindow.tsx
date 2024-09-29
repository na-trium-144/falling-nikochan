"use client";

import { useEffect, useRef, useState } from "react";
import {
  Note,
  DisplayNote,
  noteSize,
  targetY,
  bigScale,
  displayNote,
} from "@/chartFormat/seq";
import { useResizeDetector } from "react-resize-detector";
import { NoteCommand } from "@/chartFormat/command";
import Arrow from "./arrow";
import DragHandle from "./dragHandle";
import { Chart } from "@/chartFormat/chart";

interface Props {
  className?: string;
  style?: object;
  notes: Note[];
  chart?: Chart;
  currentTimeSec: number;
  currentNoteIndex: number;
  updateNote: (n: NoteCommand) => void;
}

export default function FallingWindow(props: Props) {
  const { notes, chart, currentTimeSec, currentNoteIndex } = props;
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;

  const displayNotes: { current: DisplayNote; history: DisplayNote[] }[] = [];
  if (
    marginX !== undefined &&
    marginY !== undefined &&
    boxSize &&
    currentTimeSec !== undefined
  ) {
    for (let ni = 0; ni < notes.length; ni++) {
      const dn = {
        current: displayNote(notes[ni], currentTimeSec),
        history: [] as DisplayNote[],
      };
      if (dn.current !== null) {
        for (let dt = 0; dt < 5; dt += 0.3) {
          const dn2 = displayNote(notes[ni], currentTimeSec + dt);
          if (dn2 !== null) {
            dn.history.push(dn2);
          } else {
            break;
          }
        }
        for (let dt = 0; dt < 5; dt += 0.3) {
          const dn2 = displayNote(notes[ni], currentTimeSec - dt);
          if (dn2 !== null) {
            dn.history.unshift(dn2);
          } else {
            break;
          }
        }
        displayNotes.push({ current: dn.current, history: dn.history });
      }
    }
  }

  return (
    <div className={props.className} style={props.style} ref={ref}>
      <div className="relative w-full h-full overflow-visible">
        {/* 判定線 */}
        {boxSize && marginY !== undefined && (
          <div
            className={
              "absolute h-0.5 transition duration-100 " +
              "bg-gray-400 shadow-none"
            }
            style={{
              left: 0,
              right: 0,
              bottom: targetY * boxSize + marginY,
            }}
          />
        )}
        {displayNotes.map(
          (d) =>
            boxSize &&
            marginX !== undefined &&
            marginY !== undefined && (
              <>
                {/* にこちゃん
                  currentNoteIndexと一致していたら赤色にする
                */}
                <div
                  key={d.current.id}
                  className={
                    "absolute rounded-full " +
                    (d.current.id === currentNoteIndex
                      ? "bg-red-400 "
                      : "bg-yellow-400 ")
                  }
                  style={{
                    width:
                      noteSize * boxSize * bigScale(notes[d.current.id].big),
                    height:
                      noteSize * boxSize * bigScale(notes[d.current.id].big),
                    left:
                      (d.current.pos.x -
                        (noteSize * bigScale(notes[d.current.id].big)) / 2) *
                        boxSize +
                      marginX,
                    bottom:
                      (d.current.pos.y +
                        targetY -
                        (noteSize * bigScale(notes[d.current.id].big)) / 2) *
                        boxSize +
                      marginY,
                  }}
                />
                {d.history.slice(1).map((_, di) => (
                  /* 軌跡
                  短い時間ごとに区切って位置を計算したものがd.historyで、
                  width=d.historyの2点間の距離, height=0のspanを用意し
                  border-b でその長さの水平な線を引いて
                  origin-bottom-left から d.historyの2点のatan2だけ回転することで
                  軌跡の線を引いている
                  */
                  <span
                    key={di}
                    className={
                      "absolute border-b origin-bottom-left " +
                      (d.history[di].id === currentNoteIndex
                        ? "border-red-300 z-10 "
                        : "border-gray-300 ")
                    }
                    style={{
                      width:
                        Math.sqrt(
                          Math.pow(
                            d.history[di].pos.x - d.history[di + 1].pos.x,
                            2
                          ) +
                            Math.pow(
                              d.history[di].pos.y - d.history[di + 1].pos.y,
                              2
                            )
                        ) * boxSize,
                      left: d.history[di].pos.x * boxSize + marginX,
                      bottom:
                        (d.history[di].pos.y + targetY) * boxSize + marginY,
                      transform: `rotate(${-Math.atan2(
                        d.history[di + 1].pos.y - d.history[di].pos.y,
                        d.history[di + 1].pos.x - d.history[di].pos.x
                      )}rad)`,
                    }}
                  />
                ))}
              </>
            )
        )}
        {chart &&
          currentNoteIndex >= 0 &&
          chart.notes[currentNoteIndex] &&
          boxSize &&
          marginX !== undefined &&
          marginY !== undefined && (
            <>
              {/* xを左右に動かす矢印 */}
              <Arrow
                left={
                  ((chart.notes[currentNoteIndex].hitX + 5) / 10) * boxSize +
                  marginX -
                  (0.12 + noteSize / 2) * boxSize
                }
                bottom={targetY * boxSize + marginY}
                length={0.1 * boxSize}
                lineWidth={12}
                rotation={0}
              />
              <Arrow
                left={
                  ((chart.notes[currentNoteIndex].hitX + 5) / 10) * boxSize +
                  marginX +
                  (0.12 + noteSize / 2) * boxSize
                }
                bottom={targetY * boxSize + marginY}
                length={0.1 * boxSize}
                lineWidth={12}
                rotation={Math.PI}
              />
              <DragHandle
                className="absolute "
                style={{
                  left:
                    ((chart.notes[currentNoteIndex].hitX + 5) / 10) * boxSize +
                    marginX -
                    (0.12 + noteSize / 2) * boxSize,
                  bottom: targetY * boxSize + marginY - 8,
                  width: (0.12 + noteSize / 2) * boxSize * 2,
                  height: 16,
                }}
                onMove={(x, y) =>
                  props.updateNote({
                    ...chart.notes[currentNoteIndex],
                    hitX:
                      chart.notes[currentNoteIndex].hitX + (x * 10) / boxSize,
                  })
                }
              />
              {/* vx,vyを動かす矢印 */}
              <Arrow
                left={
                  ((chart.notes[currentNoteIndex].hitX + 5) / 10) * boxSize +
                  marginX
                }
                bottom={targetY * boxSize + marginY}
                length={
                  (Math.sqrt(
                    Math.pow(chart.notes[currentNoteIndex].hitVX, 2) +
                      Math.pow(chart.notes[currentNoteIndex].hitVY, 2)
                  ) *
                    boxSize) /
                  4
                }
                lineWidth={12}
                rotation={
                  -Math.atan2(
                    chart.notes[currentNoteIndex].hitVY,
                    chart.notes[currentNoteIndex].hitVX
                  )
                }
              />
              <DragHandle
                className="absolute origin-left z-20"
                style={{
                  left:
                    ((chart.notes[currentNoteIndex].hitX + 5) / 10) * boxSize +
                    marginX,
                  bottom: targetY * boxSize + marginY - 16,
                  width:
                    (Math.sqrt(
                      Math.pow(chart.notes[currentNoteIndex].hitVX, 2) +
                        Math.pow(chart.notes[currentNoteIndex].hitVY, 2)
                    ) *
                      boxSize) /
                    4,
                  height: 32,
                  transform: `rotate(${-Math.atan2(
                    chart.notes[currentNoteIndex].hitVY,
                    chart.notes[currentNoteIndex].hitVX
                  )}rad)`,
                }}
                onMove={(x, y, cx, cy) => {
                  const winLeft = ref.current.getBoundingClientRect().left;
                  const winBottom = ref.current.getBoundingClientRect().bottom;
                  const originLeft =
                    chart.notes[currentNoteIndex].hitX * boxSize + marginX;
                  const originBottom = targetY * boxSize + marginY - 16;
                  // cx-winLeft, winBottom-cy が divのabsolute基準からマウスカーソル位置までの相対位置になる

                  // 音符位置からマウスまでの距離
                  const mouseVX = (cx - winLeft - originLeft) / boxSize;
                  const mouseVY = (winBottom - cy - originBottom) / boxSize;
                  const mouseDist = Math.sqrt(
                    Math.pow(mouseVX, 2) + Math.pow(mouseVY, 2)
                  );
                  const hitVDist = Math.sqrt(
                    Math.pow(chart.notes[currentNoteIndex].hitVX, 2) +
                      Math.pow(chart.notes[currentNoteIndex].hitVY, 2)
                  );
                  console.log(mouseVY, chart.notes[currentNoteIndex].hitVY);
                  props.updateNote({
                    ...chart.notes[currentNoteIndex],
                    hitVX:
                      chart.notes[currentNoteIndex].hitVX +
                      ((x * 4) / boxSize / mouseDist) * hitVDist,
                    hitVY:
                      chart.notes[currentNoteIndex].hitVY -
                      ((y * 4) / boxSize / mouseDist) * hitVDist,
                  });
                }}
              />
            </>
          )}
      </div>
    </div>
  );
}
