"use client";

import { useEffect, useRef, useState } from "react";
import {
  Note,
  DisplayNote,
  targetY,
  displayNote,
  bigScale,
} from "@/chartFormat/seq";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine";
import { useDisplayMode } from "@/scale";

interface Props {
  className?: string;
  style?: object;
  notes: Note[];
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  setFPS?: (fps: number) => void;
  barFlash: boolean;
}

export default function FallingWindow(props: Props) {
  const { notes, playing, getCurrentTimeSec, setFPS } = props;
  const [displayNotes, setDisplayNotes] = useState<DisplayNote[]>([]);
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;
  const fpsCount = useRef<number>(0);
  const fpsCountBegin = useRef<Date>(new Date());

  const { rem } = useDisplayMode();
  const noteSize = Math.max(1.5 * rem, 0.05 * (boxSize || 0));

  useEffect(() => {
    const i = setInterval(() => {
      const now = getCurrentTimeSec();
      if (
        playing &&
        marginX !== undefined &&
        marginY !== undefined &&
        boxSize &&
        now !== undefined
      ) {
        setDisplayNotes(
          notes.map((n) => displayNote(n, now)).filter((n) => n !== null)
        );
      } else {
        setDisplayNotes([]);
      }

      fpsCount.current++;
      if (new Date().getTime() - fpsCountBegin.current.getTime() >= 1000) {
        setFPS && setFPS(fpsCount.current);
        fpsCountBegin.current = new Date();
        fpsCount.current = 0;
      }
    }, 10);
    return () => clearInterval(i);
  }, [notes, playing, getCurrentTimeSec, marginX, marginY, boxSize, setFPS]);

  return (
    <div className={props.className} style={props.style} ref={ref}>
      <div className="relative w-full h-full overflow-visible">
        {/* 判定線 */}
        {boxSize && marginY !== undefined && (
          <TargetLine
            barFlash={props.barFlash}
            left={0}
            right="-100%"
            bottom={targetY * boxSize + marginY}
          />
        )}
        {displayNotes.map(
          (d) =>
            boxSize &&
            marginX !== undefined &&
            marginY !== undefined && (
              /* にこちゃん
                d.done に応じて画像と動きを変える
                0: 通常
                1〜3: good, ok, bad
                4: miss は画像が0と同じ
                */
              <div
                key={d.id}
                className={
                  "absolute " +
                  (d.done === 0
                    ? ""
                    : d.done === 1
                    ? "transition ease-linear duration-300 -translate-y-4 opacity-0 scale-125"
                    : d.done === 2
                    ? "transition ease-linear duration-300 -translate-y-2 opacity-0"
                    : d.done === 3
                    ? "transition ease-linear duration-300 opacity-0"
                    : "")
                }
                style={{
                  /* noteSize: にこちゃんのサイズ(boxSizeに対する比率), boxSize: 画面のサイズ */
                  width: noteSize * bigScale(notes[d.id].big),
                  height: noteSize * bigScale(notes[d.id].big),
                  left:
                    d.pos.x * boxSize -
                    (noteSize * bigScale(notes[d.id].big)) / 2 +
                    marginX,
                  bottom:
                    d.pos.y * boxSize +
                    targetY * boxSize -
                    (noteSize * bigScale(notes[d.id].big)) / 2 +
                    marginY,
                }}
              >
                <img
                  src={`/nikochan${d.done <= 3 ? d.done : 0}.svg`}
                  className="w-full h-full "
                />
                {/* chainBonusをにこちゃんの右上に表示する */}
                {d.chainBonus && d.chain && (
                  <span
                    className={
                      "absolute w-12 text-xs " +
                      (d.chain >= 100 || d.bigDone ? "text-orange-500 " : "")
                    }
                    style={{ bottom: "100%", left: "100%" }}
                  >
                    × {d.chainBonus.toFixed(2)}
                  </span>
                )}
              </div>
            )
        )}
      </div>
    </div>
  );
}
