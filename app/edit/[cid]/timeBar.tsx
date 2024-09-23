"use client";

import {
  findBpmIndexFromStep,
  getStep,
  getTimeSec,
  Note,
} from "@/chartFormat/seq";
import { useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { stepNStr, timeSecStr, timeStr } from "./str";
import { Step, stepAdd, stepCmp, stepZero } from "@/chartFormat/step";
import { Chart } from "@/chartFormat/chart";

interface Props {
  currentTimeSecWithoutOffset: number;
  currentNoteIndex: number;
  currentStep: Step;
  chart?: Chart;
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
  const [timeBarBeginStep, setTimeBarBeginStep] = useState<Step>(stepZero());

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

  // timebarに表示するstep目盛りのリスト
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

  const beginBpmIndex =
    chart && stepCmp(timeBarBeginStep, stepZero()) > 0
      ? findBpmIndexFromStep(chart?.bpmChanges, timeBarBeginStep)
      : undefined;

  return (
    <div
      className={"h-2 bg-gray-300 relative mt-12 mb-10 overflow-visible"}
      ref={timeBarRef}
    >
      {/* 秒数目盛り */}
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
      {/* step目盛り 目盛りのリストは別で計算してある */}
      {timeBarSteps.map(
        ({ step, timeSec }, dt) =>
          stepCmp(step, stepZero()) >= 0 && (
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
          )
      )}
      {/* bpm変化 */}
      <div className="absolute" style={{ bottom: -40, left: 0 }}>
        <span className="mr-1">BPM:</span>
        {beginBpmIndex !== undefined && (
          <span>{chart?.bpmChanges[beginBpmIndex]?.bpm.toString()}</span>
        )}
      </div>
      {chart?.bpmChanges.map(
        (ch, i) =>
          ch.timeSec >= timeBarBeginSec &&
          ch.timeSec < timeBarBeginSec + timeBarWidth / timeBarPxPerSec && (
            <span
              key={i}
              className="absolute "
              style={{
                bottom: -40,
                left: timeBarPos(ch.timeSec),
              }}
            >
              <span className="absolute bottom-0">{ch.bpm}</span>
            </span>
          )
      )}
      {/* 現在位置カーソル */}
      <div
        className="absolute border-l border-amber-400 shadow shadow-yellow-400"
        style={{
          top: -40,
          bottom: -20,
          left: timeBarPos(currentTimeSecWithoutOffset),
        }}
      />
      {/* 現在時刻 */}
      <span
        className="absolute "
        style={{
          top: -40,
          left: timeBarPos(currentTimeSecWithoutOffset),
        }}
      >
        {timeStr(currentTimeSecWithoutOffset)}
      </span>
      {/* にこちゃんの位置 */}
      {chart &&
        notesAll.map(
          (n) =>
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
