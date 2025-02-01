"use client";

import {
  findBpmIndexFromStep,
  getSignatureState,
  getStep,
  getTimeSec,
  Note,
} from "@/chartFormat/seq";
import { useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { timeSecStr, timeStr } from "./str";
import {
  Step,
  stepAdd,
  stepCmp,
  stepImproper,
  stepZero,
} from "@/chartFormat/step";
import { Chart, Level } from "@/chartFormat/chart";
import { useDisplayMode } from "@/scale";
import { getBarLength } from "@/chartFormat/command";

interface Props {
  currentTimeSecWithoutOffset: number;
  currentNoteIndex: number;
  currentStep: Step;
  chart?: Chart;
  currentLevel?: Level;
  notesAll: Note[];
  snapDivider: number;
  ytId: string;
  timeBarPxPerSec: number;
}
export default function TimeBar(props: Props) {
  const {
    currentTimeSecWithoutOffset,
    currentNoteIndex,
    chart,
    currentLevel,
    notesAll,
    snapDivider,
    timeBarPxPerSec,
  } = props;
  const { rem } = useDisplayMode();

  const timeBarResize = useResizeDetector();
  const timeBarWidth = timeBarResize.width || 500;
  const timeBarRef = timeBarResize.ref;
  // timebar左端の時刻
  const [timeBarBeginSec, setTimeBarBeginSec] = useState<number>(-1);
  const [timeBarBeginStep, setTimeBarBeginStep] = useState<Step>(stepZero());
  // 現在のカーソル位置中心に拡大縮小
  const timeBarPxPerSecPrev = useRef<number>(timeBarPxPerSec);
  useEffect(() => {
    if (timeBarPxPerSecPrev.current !== timeBarPxPerSec) {
      setTimeBarBeginSec(
        currentTimeSecWithoutOffset -
          (currentTimeSecWithoutOffset - timeBarBeginSec) /
            (timeBarPxPerSec / timeBarPxPerSecPrev.current)
      );
      timeBarPxPerSecPrev.current = timeBarPxPerSec;
    }
  }, [timeBarPxPerSec, currentTimeSecWithoutOffset, timeBarBeginSec]);

  // timebar上の位置を計算
  const timeBarPos = (timeSec: number) =>
    (timeSec - timeBarBeginSec) * timeBarPxPerSec;
  const marginPxLeft = 4 * rem;
  useEffect(() => {
    const marginPxRight = timeBarWidth / 2;
    if (
      currentTimeSecWithoutOffset - timeBarBeginSec <
      marginPxLeft / timeBarPxPerSec
    ) {
      const timeBarBeginSec =
        currentTimeSecWithoutOffset - marginPxLeft / timeBarPxPerSec;
      setTimeBarBeginSec(timeBarBeginSec);
      if (chart && currentLevel) {
        setTimeBarBeginStep(
          getStep(
            currentLevel.bpmChanges,
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
      if (chart && currentLevel) {
        setTimeBarBeginStep(
          getStep(
            currentLevel.bpmChanges,
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
    timeBarPxPerSec,
    marginPxLeft,
    currentLevel,
  ]);

  // timebarに表示するstep目盛りのリスト
  const timeBarSteps: { step: Step; timeSec: number }[] = [];
  if (chart && currentLevel) {
    timeBarSteps.push({
      step: timeBarBeginStep,
      timeSec: getTimeSec(currentLevel.bpmChanges, timeBarBeginStep),
    });
    while (true) {
      const s = stepAdd(timeBarSteps[timeBarSteps.length - 1].step, {
        fourth: 0,
        numerator: 1,
        denominator: snapDivider,
      });
      const t = getTimeSec(currentLevel.bpmChanges, s) + chart.offset;
      if (t - timeBarBeginSec < timeBarWidth / timeBarPxPerSec) {
        timeBarSteps.push({ step: s, timeSec: t });
      } else {
        break;
      }
    }
  }

  const beginBpmIndex =
    currentLevel && stepCmp(timeBarBeginStep, stepZero()) > 0
      ? findBpmIndexFromStep(currentLevel.bpmChanges, timeBarBeginStep)
      : undefined;
  const beginSpeedIndex =
    currentLevel && stepCmp(timeBarBeginStep, stepZero()) > 0
      ? findBpmIndexFromStep(currentLevel.speedChanges, timeBarBeginStep)
      : undefined;
  const beginSignatureIndex =
    currentLevel && stepCmp(timeBarBeginStep, stepZero()) > 0
      ? findBpmIndexFromStep(currentLevel.signature, timeBarBeginStep)
      : undefined;
  const beginBarLength =
    currentLevel && beginSignatureIndex !== undefined
      ? getBarLength(currentLevel.signature[beginSignatureIndex])
      : undefined;

  return (
    <div
      className={
        "h-6 bg-slate-200 dark:bg-stone-700 relative mt-10 mb-20 overflow-visible"
      }
      ref={timeBarRef}
    >
      {/* 秒数目盛り */}
      {Array.from(new Array(Math.ceil(timeBarWidth / timeBarPxPerSec))).map(
        (_, dt) => (
          <span
            key={dt}
            className="absolute border-l border-gray-400 dark:border-gray-600 "
            style={{
              top: -1.25 * rem,
              bottom: -4,
              left: timeBarPos(Math.ceil(timeBarBeginSec) + dt),
            }}
          >
            {timeSecStr(Math.ceil(timeBarBeginSec) + dt)}
          </span>
        )
      )}
      {/* step目盛り 目盛りのリストは別で計算してある */}
      {props.currentLevel &&
        timeBarSteps
          .map(({ step, timeSec }) => ({
            step,
            timeSec,
            ss: getSignatureState(props.currentLevel!.signature, step),
          }))
          .map(
            ({ step, timeSec, ss }, dt) =>
              stepCmp(step, stepZero()) >= 0 && (
                <span
                  key={dt}
                  className="absolute border-l border-red-400 dark:border-red-700 "
                  style={{
                    top: -4,
                    bottom: ss.count.numerator === 0 ? -1.25 * rem : -4,
                    left: timeBarPos(timeSec), // offsetはtimeBarStepsに足されている
                  }}
                >
                  <span className="absolute bottom-0">
                    {ss.count.numerator === 0 && (
                      <>
                        {ss.count.fourth === 0 && (ss.barNum + 1).toString()};
                        {ss.count.fourth + 1}
                      </>
                    )}
                  </span>
                </span>
              )
          )}
      {/* bpm変化 */}
      <div className="absolute" style={{ bottom: -2.5 * rem, left: 0 }}>
        <span className="mr-1">BPM:</span>
        {beginBpmIndex !== undefined && (
          <span>{currentLevel?.bpmChanges[beginBpmIndex]?.bpm.toString()}</span>
        )}
      </div>
      {chart &&
        currentLevel?.bpmChanges.map(
          (ch, i) =>
            ch.timeSec + chart.offset >= timeBarBeginSec &&
            ch.timeSec + chart.offset <
              timeBarBeginSec + timeBarWidth / timeBarPxPerSec && (
              <span
                key={i}
                className="absolute "
                style={{
                  bottom: -2.5 * rem,
                  left: timeBarPos(ch.timeSec + chart.offset),
                }}
              >
                <span className="absolute bottom-0">{ch.bpm}</span>
              </span>
            )
        )}
      {/* speed変化 */}
      <div className="absolute" style={{ bottom: -3.75 * rem, left: 0 }}>
        <span className="mr-1">Speed:</span>
        {beginSpeedIndex !== undefined && (
          <span>
            {currentLevel?.speedChanges[beginSpeedIndex]?.bpm.toString()}
          </span>
        )}
      </div>
      {chart &&
        currentLevel?.speedChanges.map(
          (ch, i) =>
            ch.timeSec + chart.offset >= timeBarBeginSec &&
            ch.timeSec + chart.offset <
              timeBarBeginSec + timeBarWidth / timeBarPxPerSec && (
              <span
                key={i}
                className="absolute "
                style={{
                  bottom: -3.75 * rem,
                  left: timeBarPos(ch.timeSec + chart.offset),
                }}
              >
                <span className="absolute bottom-0">{ch.bpm}</span>
              </span>
            )
        )}
      {/* signature変化 */}
      <div className="absolute" style={{ bottom: -5 * rem, left: 0 }}>
        <span className="mr-1">Beat:</span>
        {beginBarLength?.map((len, i) => (
          <>
            {i >= 1 && <span className="mx-0.5">+</span>}
            <span>{stepImproper(len)}</span>
            <span>/</span>
            <span>{len.denominator * 4}</span>
          </>
        ))}
      </div>
      {chart &&
        currentLevel?.signature
          .map((sig) => ({
            sig,
            len: getBarLength(sig),
            sec: getTimeSec(currentLevel.bpmChanges, sig.step),
          }))
          .map(
            ({ len, sec }, i) =>
              sec + chart.offset >= timeBarBeginSec &&
              sec + chart.offset <
                timeBarBeginSec + timeBarWidth / timeBarPxPerSec && (
                <span
                  key={i}
                  className="absolute border-l-2 border-slate-600 dark:border-stone-400 "
                  style={{
                    top: -4,
                    bottom: -5 * rem,
                    left: timeBarPos(sec + chart.offset),
                  }}
                >
                  <span className="absolute bottom-0">
                    {len.map((len, i) => (
                      <span key={i}>
                        {i >= 1 && <span className="mx-0.5">+</span>}
                        <span>{stepImproper(len)}</span>
                        <span>/</span>
                        <span>{len.denominator * 4}</span>
                      </span>
                    ))}
                  </span>
                </span>
              )
          )}
      {/* 現在位置カーソル */}
      <div
        className="absolute border-l border-amber-400 shadow shadow-yellow-400"
        style={{
          top: -2.5 * rem,
          bottom: -5 * rem,
          left: timeBarPos(currentTimeSecWithoutOffset),
        }}
      />
      {/* 現在時刻 */}
      <span
        className="absolute "
        style={{
          top: -2.5 * rem,
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
              timeBarBeginSec + timeBarWidth / timeBarPxPerSec &&
            // 同じ位置に2つ以上の音符を重ねない
            n.hitTimeSec !== notesAll[n.id + 1]?.hitTimeSec && (
              <span
                key={n.id}
                className={
                  "absolute rounded-full " +
                  (n.hitTimeSec === notesAll[currentNoteIndex]?.hitTimeSec
                    ? "bg-red-400 "
                    : "bg-yellow-400 ")
                }
                style={{
                  width: n.big ? "1.5rem" : "1rem",
                  height: n.big ? "1.5rem" : "1rem",
                  top: ((6 / 4 - (n.big ? 1.5 : 1)) * rem) / 2,
                  left:
                    timeBarPos(n.hitTimeSec + chart.offset) -
                    ((n.big ? 1.5 : 1) * rem) / 2,
                }}
              >
                {/* 重なっている音符の数 */}
                <span
                  className="absolute inset-x-0 text-center"
                  style={{ top: n.big ? "0.125rem" : 0 }}
                >
                  {(() => {
                    const length = notesAll
                      .slice(0, n.id)
                      .filter((n2) => n.hitTimeSec === n2.hitTimeSec).length;
                    return length > 0 ? length + 1 : null;
                  })()}
                </span>
              </span>
            )
        )}
    </div>
  );
}
