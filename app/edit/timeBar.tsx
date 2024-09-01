"use client";

import { Chart, Step, stepAdd } from "@/chartFormat/command";
import { getStep, getTimeSec, Note } from "@/chartFormat/seq";
import { useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { stepNStr, timeSecStr, timeStr } from "./str";

interface Props {
  currentTimeSecWithoutOffset: number;
  currentNoteIndex: number | null;
  chart: Chart | null;
  notesAll: Note[];
  snapDivider: number;
}
export default function TimeBar(props: Props) {
  const {
    currentTimeSecWithoutOffset,
    currentNoteIndex,
    chart,
    notesAll,
    snapDivider,
  } = props;

  const timeBarResize = useResizeDetector();
  const timeBarWidth = timeBarResize.width || 500;
  const timeBarRef = timeBarResize.ref;
  // timebar左端の時刻
  const [timeBarBeginSec, setTimeBarBeginSec] = useState<number>(-1);
  const [timeBarBeginStep, setTimeBarBeginStep] = useState<Step>(0);

  const timeBarPxPerSec = 300;
  // timebar上の位置を計算
  const timeBarPos = (timeSec: number) =>
    (timeSec - timeBarBeginSec) * timeBarPxPerSec;
  useEffect(() => {
    const marginPxLeft = 50;
    const marginPxRight = timeBarWidth / 2;
    if (
      currentTimeSecWithoutOffset - timeBarBeginSec <
      marginPxLeft / timeBarPxPerSec
    ) {
      const timeBarBeginSec =
        currentTimeSecWithoutOffset - marginPxLeft / timeBarPxPerSec;
      setTimeBarBeginSec(timeBarBeginSec);
      if (chart) {
        setTimeBarBeginStep(
          getStep(
            chart?.bpmChanges,
            timeBarBeginSec - chart.offset,
            snapDivider
          )
        );
      }
    } else if (
      currentTimeSecWithoutOffset - timeBarBeginSec >
      (timeBarWidth - marginPxRight) / timeBarPxPerSec
    ) {
      const timeBarBeginSec =
        currentTimeSecWithoutOffset -
        (timeBarWidth - marginPxRight) / timeBarPxPerSec;
      setTimeBarBeginSec(timeBarBeginSec);
      if (chart) {
        setTimeBarBeginStep(
          getStep(
            chart?.bpmChanges,
            timeBarBeginSec - chart.offset,
            snapDivider
          )
        );
      }
    }
  }, [
    currentTimeSecWithoutOffset,
    timeBarBeginSec,
    timeBarWidth,
    chart,
    snapDivider,
  ]);

  const timeBarSteps: { step: Step; timeSec: number }[] = [];
  if (chart) {
    timeBarSteps.push({
      step: timeBarBeginStep,
      timeSec: getTimeSec(chart.bpmChanges, timeBarBeginStep),
    });
    while (true) {
      const s = stepAdd(timeBarSteps[timeBarSteps.length - 1].step, {
        fourth: 0,
        numerator: 1,
        denominator: snapDivider,
      });
      const t = getTimeSec(chart.bpmChanges, s) + chart.offset;
      if (t - timeBarBeginSec < timeBarWidth / timeBarPxPerSec) {
        timeBarSteps.push({ step: s, timeSec: t });
      } else {
        break;
      }
    }
  }

  return (
    <div
      className={"h-2 bg-gray-300 relative mt-12 mb-8 overflow-visible"}
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
      {timeBarSteps.map(({ step, timeSec }, dt) => (
        <span
          key={dt}
          className="absolute border-l border-red-400 "
          style={{
            top: -4,
            bottom: step.numerator === 0 ? -20 : -4,
            left: timeBarPos(timeSec),
          }}
        >
          <span className="absolute bottom-0">{stepNStr(step)}</span>
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
