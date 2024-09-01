"use client";

import { Chart } from "@/chartFormat/command";
import { getBpm, getStep, getTimeSec, Note } from "@/chartFormat/seq";
import { useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { timeSecStr, timeStr } from "./str";

interface Props {
  currentTimeSecWithoutOffset: number;
  currentNoteIndex: number | null;
  chart: Chart | null;
  notesAll: Note[];
}
export default function TimeBar(props: Props) {
  const { currentTimeSecWithoutOffset, currentNoteIndex, chart, notesAll } =
    props;
  const currentBpm =
    chart &&
    getBpm(chart.bpmChanges, currentTimeSecWithoutOffset - chart.offset);

  const timeBarResize = useResizeDetector();
  const timeBarWidth = timeBarResize.width || 500;
  const timeBarRef = timeBarResize.ref;
  // timebar左端の時刻
  const [timeBarBeginSec, setTimeBarBeginSec] = useState<number>(-1);

  const timeBarPxPerSec = 300;
  // timebar上の位置を計算
  const timeBarPos = (timeSec: number) =>
    (timeSec - timeBarBeginSec) * timeBarPxPerSec;
  useEffect(() => {
    const marginPxLeft = 50;
    const marginPxRight = 300;
    if (
      currentTimeSecWithoutOffset - timeBarBeginSec <
      marginPxLeft / timeBarPxPerSec
    ) {
      setTimeBarBeginSec(
        currentTimeSecWithoutOffset - marginPxLeft / timeBarPxPerSec
      );
    } else if (
      currentTimeSecWithoutOffset - timeBarBeginSec >
      (timeBarWidth - marginPxRight) / timeBarPxPerSec
    ) {
      setTimeBarBeginSec(
        currentTimeSecWithoutOffset -
          (timeBarWidth - marginPxRight) / timeBarPxPerSec
      );
    }
  }, [currentTimeSecWithoutOffset, timeBarBeginSec, timeBarWidth]);

  const [timeBarBeginStep, setTimeBarBeginStep] = useState<number>(0);
  useEffect(() => {
    if (chart) {
      setTimeBarBeginStep(
        getStep(chart?.bpmChanges, timeBarBeginSec - chart.offset)
      );
    }
  }, [chart, timeBarBeginSec, currentTimeSecWithoutOffset]);

  return (
    <div
      className={"h-2 bg-gray-300 relative mt-12 mb-12 overflow-visible"}
      ref={timeBarRef}
    >
      {Array.from(new Array(Math.ceil(timeBarWidth / timeBarPxPerSec))).map(
        (_, dt) => (
          <span
            key={dt}
            className="absolute border-l border-gray-400"
            style={{
              top: -20,
              bottom: -4,
              left: timeBarPos(Math.ceil(timeBarBeginSec) + dt),
            }}
          >
            {timeSecStr(Math.ceil(timeBarBeginSec) + dt)}
          </span>
        )
      )}
      {chart &&
        currentBpm &&
        Array.from(
          new Array(
            Math.ceil(timeBarWidth / (timeBarPxPerSec * (60 / currentBpm)))
          )
        ).map((_, dt) => (
          <span
            key={dt}
            className="absolute border-l border-red-400 "
            style={{
              top: -4,
              bottom: -20,
              left: timeBarPos(
                getTimeSec(
                  chart!.bpmChanges,
                  Math.ceil(timeBarBeginStep) + dt
                ) + chart.offset
              ),
            }}
          >
            <span className="absolute bottom-0">
              {Math.ceil(timeBarBeginStep) + dt}
            </span>
          </span>
        ))}
      {chart?.bpmChanges.map((ch, i) => (
        <span
          key={i}
          className="absolute "
          style={{
            bottom: -40,
            left: timeBarPos(getTimeSec(chart!.bpmChanges, ch.step)),
          }}
        >
          <span className="absolute bottom-0">{ch.bpm}</span>
        </span>
      ))}

      <div
        className="absolute border-l border-amber-400 shadow shadow-yellow-400"
        style={{
          top: -40,
          bottom: -20,
          left: timeBarPos(currentTimeSecWithoutOffset),
        }}
      />
      <span
        className="absolute "
        style={{
          top: -40,
          left: timeBarPos(currentTimeSecWithoutOffset),
        }}
      >
        {timeStr(currentTimeSecWithoutOffset)}
      </span>
      {chart &&
        notesAll.map(
          (n, i) =>
            n.hitTimeSec + chart.offset > timeBarBeginSec &&
            n.hitTimeSec + chart.offset <
              timeBarBeginSec + timeBarWidth / timeBarPxPerSec && (
              <span
                key={n.id}
                className={
                  "absolute w-3 h-3 rounded-full " +
                  (n.id === currentNoteIndex ? "bg-red-400 " : "bg-yellow-400 ")
                }
                style={{
                  top: -2,
                  left: timeBarPos(n.hitTimeSec + chart.offset) - 6,
                }}
              />
            )
        )}
    </div>
  );
}
