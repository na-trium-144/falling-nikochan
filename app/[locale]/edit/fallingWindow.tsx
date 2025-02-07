"use client";

import {
  Note,
  DisplayNote,
  targetY,
  bigScale,
  displayNote,
} from "@/../../chartFormat/seq.js";
import { useResizeDetector } from "react-resize-detector";
import { NoteCommand } from "@/../../chartFormat/command.js";
import Arrow from "./arrow.js";
import DragHandle from "./dragHandle.js";
import { Level } from "@/../../chartFormat/chart.js";
import { useDisplayMode } from "@/scale.js";

interface Props {
  className?: string;
  style?: object;
  notes: Note[];
  currentLevel?: Level;
  currentTimeSec: number;
  currentNoteIndex: number;
  updateNote: (n: NoteCommand) => void;
  dragMode: null | "p" | "v" | "a";
  setDragMode: (mode: null | "p" | "v" | "a") => void;
  inCodeTab: boolean;
}

export default function FallingWindow(props: Props) {
  const { notes, currentLevel, currentTimeSec, currentNoteIndex, dragMode } =
    props;
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;

  const { rem } = useDisplayMode();
  const noteSize = Math.max(1.5 * rem, 0.05 * (boxSize || 0));

  const noteEditable =
    props.currentLevel?.notes[props.currentNoteIndex] &&
    props.currentLevel?.notes[props.currentNoteIndex].luaLine !== null &&
    !props.inCodeTab;

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
          (d, di) =>
            boxSize &&
            marginX !== undefined &&
            marginY !== undefined && (
              <NikochanAndTrace
                key={di}
                displayNote={d}
                currentNoteIndex={currentNoteIndex}
                boxSize={boxSize}
                marginX={marginX}
                marginY={marginY}
                noteSize={noteSize}
                notes={notes}
              />
            )
        )}
        {currentLevel &&
          currentNoteIndex >= 0 &&
          currentLevel.notes[currentNoteIndex] &&
          boxSize &&
          marginX !== undefined &&
          marginY !== undefined &&
          noteEditable && (
            <>
              {/* xを左右に動かす矢印 */}
              {dragMode === "p" ? (
                <>
                  <Arrow
                    left={
                      ((currentLevel.notes[currentNoteIndex].hitX + 5) / 10) *
                        boxSize +
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
                      ((currentLevel.notes[currentNoteIndex].hitX + 5) / 10) *
                        boxSize +
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
                      props.updateNote({
                        ...currentLevel.notes[currentNoteIndex],
                        hitX: Math.round(
                          ((cx - winLeft - marginX) * 10) / boxSize - 5
                        ),
                      });
                    }}
                  />
                </>
              ) : dragMode === "v" ? (
                <>
                  {/* vx,vyを動かす矢印 */}
                  <Arrow
                    left={
                      ((currentLevel.notes[currentNoteIndex].hitX + 5) / 10) *
                        boxSize +
                      marginX
                    }
                    bottom={targetY * boxSize + marginY}
                    length={
                      (Math.sqrt(
                        Math.pow(
                          currentLevel.notes[currentNoteIndex].hitVX,
                          2
                        ) +
                          Math.pow(
                            currentLevel.notes[currentNoteIndex].hitVY,
                            2
                          )
                      ) *
                        boxSize) /
                      4
                    }
                    lineWidth={12}
                    rotation={
                      -Math.atan2(
                        currentLevel.notes[currentNoteIndex].hitVY,
                        currentLevel.notes[currentNoteIndex].hitVX
                      )
                    }
                  />
                  <DragHandle
                    className="absolute inset-0"
                    onMove={(_x, _y, cx, cy) => {
                      const winLeft = ref.current.getBoundingClientRect().left;
                      const winBottom =
                        ref.current.getBoundingClientRect().bottom;
                      const originLeft =
                        ((currentLevel.notes[currentNoteIndex].hitX + 5) / 10) *
                          boxSize +
                        marginX;
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
                      console.log(
                        mouseVY,
                        currentLevel.notes[currentNoteIndex].hitVY
                      );
                      props.updateNote({
                        ...currentLevel.notes[currentNoteIndex],
                        hitVX: Math.round(mouseVX * 4),
                        hitVY: Math.round(mouseVY * 4),
                      });
                    }}
                  />
                </>
              ) : (
                <div
                  className="absolute inset-0 z-10 "
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

interface NProps {
  displayNote: { current: DisplayNote; history: DisplayNote[] };
  currentNoteIndex: number;
  boxSize: number;
  marginX: number;
  marginY: number;
  noteSize: number;
  notes: Note[];
}
function NikochanAndTrace(props: NProps) {
  const {
    displayNote,
    currentNoteIndex,
    boxSize,
    marginX,
    marginY,
    noteSize,
    notes,
  } = props;
  return (
    <>
      {/* にこちゃん
        currentNoteIndexと一致していたら赤色にする
      */}
      <div
        className={
          "absolute rounded-full " +
          (displayNote.current.id === currentNoteIndex
            ? "bg-red-400 "
            : "bg-yellow-400 ")
        }
        style={{
          width: noteSize * bigScale(notes[displayNote.current.id].big),
          height: noteSize * bigScale(notes[displayNote.current.id].big),
          left:
            displayNote.current.pos.x * boxSize -
            (noteSize * bigScale(notes[displayNote.current.id].big)) / 2 +
            marginX,
          bottom:
            displayNote.current.pos.y * boxSize +
            targetY * boxSize -
            (noteSize * bigScale(notes[displayNote.current.id].big)) / 2 +
            marginY,
        }}
      />
      {displayNote.history.slice(1).map((_, di) => (
        /* 軌跡
                  短い時間ごとに区切って位置を計算したものがd.historyで、
                  width=displayNote.historyの2点間の距離, height=0のspanを用意し
                  border-b でその長さの水平な線を引いて
                  origin-bottom-left から displayNote.historyの2点のatan2だけ回転することで
                  軌跡の線を引いている
                  */
        <span
          key={di}
          className={
            "absolute border-b origin-bottom-left " +
            (displayNote.history[di].id === currentNoteIndex
              ? "border-red-300 z-10 "
              : "border-gray-300 ")
          }
          style={{
            width:
              Math.sqrt(
                Math.pow(
                  displayNote.history[di].pos.x -
                    displayNote.history[di + 1].pos.x,
                  2
                ) +
                  Math.pow(
                    displayNote.history[di].pos.y -
                      displayNote.history[di + 1].pos.y,
                    2
                  )
              ) * boxSize,
            left: displayNote.history[di].pos.x * boxSize + marginX,
            bottom:
              (displayNote.history[di].pos.y + targetY) * boxSize + marginY,
            transform: `rotate(${-Math.atan2(
              displayNote.history[di + 1].pos.y - displayNote.history[di].pos.y,
              displayNote.history[di + 1].pos.x - displayNote.history[di].pos.x
            )}rad)`,
          }}
        />
      ))}
    </>
  );
}
