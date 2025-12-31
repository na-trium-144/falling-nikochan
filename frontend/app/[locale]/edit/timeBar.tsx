"use client";

import clsx from "clsx/lite";
import {
  findBpmIndexFromStep,
  getSignatureState,
  getStep,
  getTimeSec,
  Note,
} from "@falling-nikochan/chart";
import { useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { timeSecStr, timeStr } from "./str.js";
import {
  Step,
  stepAdd,
  stepCmp,
  stepImproper,
  stepZero,
} from "@falling-nikochan/chart";
import { useDisplayMode } from "@/scale.js";
import { getBarLength } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { ChartEdit, LevelEdit } from "@falling-nikochan/chart";
import { ChartEditing } from "./chartState.js";

interface Props {
  chart?: ChartEditing;
  timeBarPxPerSec: number;
}
export default function TimeBar(props: Props) {
  const t = useTranslations("edit.timeBar");
  const { chart, timeBarPxPerSec } = props;
  const { rem } = useDisplayMode();

  const timeBarResize = useResizeDetector();
  const timeBarWidth = timeBarResize.width || 500;
  const timeBarRef = timeBarResize.ref;
  // timebar左端の時刻
  const [timeBarBeginSec, setTimeBarBeginSec] = useState<number>(-1);
  const [timeBarBeginStep, setTimeBarBeginStep] = useState<Step>(stepZero());
  const timeBarPxPerSecPrev = useRef<number>(timeBarPxPerSec);

  // timebar上の位置を計算
  const timeBarPos = (timeSec: number) =>
    (timeSec - timeBarBeginSec) * timeBarPxPerSec;
  const marginPxLeft = 4 * rem;
  useEffect(() => {
    const updateTimeBarBegin = () => {
      if (chart?.currentLevel) {
        const marginPxRight = timeBarWidth / 2;
        // 現在のカーソル位置中心に拡大縮小
        if (
          timeBarPxPerSecPrev.current !== timeBarPxPerSec &&
          chart?.currentLevel
        ) {
          setTimeBarBeginSec(
            chart.currentLevel.current.timeSec +
              chart.offset -
              (chart.currentLevel.current.timeSec +
                chart.offset -
                timeBarBeginSec) /
                (timeBarPxPerSec / timeBarPxPerSecPrev.current)
          );
          timeBarPxPerSecPrev.current = timeBarPxPerSec;
        }
        if (
          chart.currentLevel.current.timeSec + chart.offset - timeBarBeginSec <
          marginPxLeft / timeBarPxPerSec
        ) {
          const timeBarBeginSec =
            chart.currentLevel.current.timeSec +
            chart.offset -
            marginPxLeft / timeBarPxPerSec;
          setTimeBarBeginSec(timeBarBeginSec);
        } else if (
          chart.currentLevel.current.timeSec + chart.offset - timeBarBeginSec >
          (timeBarWidth - marginPxRight) / timeBarPxPerSec
        ) {
          const timeBarBeginSec =
            chart.currentLevel.current.timeSec +
            chart.offset -
            (timeBarWidth - marginPxRight) / timeBarPxPerSec;
          setTimeBarBeginSec(timeBarBeginSec);
        }
        setTimeBarBeginStep(
          getStep(
            chart.currentLevel.freeze.bpmChanges,
            timeBarBeginSec - chart.offset,
            chart.currentLevel.current.snapDivider
          )
        );
      }
    };
    updateTimeBarBegin();
    chart?.on("rerender", updateTimeBarBegin);
    return () => {
      chart?.off("rerender", updateTimeBarBegin);
    };
  }, [timeBarBeginSec, timeBarWidth, chart, timeBarPxPerSec, marginPxLeft]);

  // timebarに表示するstep目盛りのリスト
  const timeBarSteps: { step: Step; timeSec: number }[] = [];
  if (chart?.currentLevel) {
    timeBarSteps.push({
      step: timeBarBeginStep,
      timeSec: getTimeSec(
        chart.currentLevel.freeze.bpmChanges,
        timeBarBeginStep
      ),
    });
    while (true) {
      const s = stepAdd(timeBarSteps[timeBarSteps.length - 1].step, {
        fourth: 0,
        numerator: 1,
        denominator: chart.currentLevel.current.snapDivider,
      });
      const t =
        getTimeSec(chart.currentLevel.freeze.bpmChanges, s) + chart.offset;
      if (t - timeBarBeginSec < timeBarWidth / timeBarPxPerSec) {
        timeBarSteps.push({ step: s, timeSec: t });
      } else {
        break;
      }
    }
  }

  const beginBpmIndex =
    chart?.currentLevel && stepCmp(timeBarBeginStep, stepZero()) > 0
      ? findBpmIndexFromStep(
          chart.currentLevel.freeze.bpmChanges,
          timeBarBeginStep
        )
      : undefined;
  const beginSpeedIndex =
    chart?.currentLevel && stepCmp(timeBarBeginStep, stepZero()) > 0
      ? findBpmIndexFromStep(
          chart.currentLevel.freeze.speedChanges,
          timeBarBeginStep
        )
      : undefined;
  const beginSignatureIndex =
    chart?.currentLevel && stepCmp(timeBarBeginStep, stepZero()) > 0
      ? findBpmIndexFromStep(
          chart.currentLevel.freeze.signature,
          timeBarBeginStep
        )
      : undefined;
  const beginBarLength =
    chart?.currentLevel && beginSignatureIndex !== undefined
      ? getBarLength(chart.currentLevel.freeze.signature[beginSignatureIndex])
      : undefined;

  return (
    <div
      className={clsx(
        "h-6 bg-slate-200 dark:bg-stone-700 relative mt-10 mb-20 overflow-y-visible overflow-x-clip"
      )}
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
      {chart?.currentLevel &&
        timeBarSteps
          .map(({ step, timeSec }) => ({
            step,
            timeSec,
            ss: getSignatureState(chart.currentLevel!.freeze.signature, step),
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
        <span className="mr-1">{t("bpm")}:</span>
        {beginBpmIndex !== undefined && (
          <span>
            {chart?.currentLevel?.freeze.bpmChanges[
              beginBpmIndex
            ]?.bpm.toString()}
          </span>
        )}
      </div>
      {chart?.currentLevel?.freeze.bpmChanges.map(
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
        <span className="mr-1">{t("speed")}:</span>
        {beginSpeedIndex !== undefined && (
          <span>
            {chart?.currentLevel?.freeze.speedChanges[
              beginSpeedIndex
            ]?.bpm.toString()}
          </span>
        )}
      </div>
      {chart?.currentLevel?.freeze.speedChanges.map(
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
              <span className="absolute bottom-0">
                {ch.bpm}
                {chart.currentLevel!.freeze.speedChanges[i + 1]?.interp && (
                  <span
                    className="absolute inset-y-0 left-0 m-auto h-0 border border-slate-800 dark:border-stone-300"
                    style={{
                      width:
                        timeBarPos(
                          chart.currentLevel!.freeze.speedChanges[i + 1].timeSec
                        ) - timeBarPos(ch.timeSec),
                    }}
                  />
                )}
                {ch.interp && i >= 1 && (
                  <span
                    className="absolute inset-y-0 right-full m-auto h-0 border border-slate-800 dark:border-stone-300"
                    style={{
                      width:
                        timeBarPos(ch.timeSec) -
                        timeBarPos(
                          chart.currentLevel!.freeze.speedChanges[i - 1].timeSec
                        ),
                    }}
                  />
                )}
              </span>
            </span>
          )
      )}
      {/* signature変化 */}
      <div className="absolute" style={{ bottom: -5 * rem, left: 0 }}>
        <span className="mr-1">{t("beat")}:</span>
        {beginBarLength?.map((len, i) => (
          <>
            {i >= 1 && <span className="mx-0.5">+</span>}
            <span>{stepImproper(len)}</span>
            <span>/</span>
            <span>{len.denominator * 4}</span>
          </>
        ))}
      </div>
      {chart?.currentLevel?.freeze.signature
        .map((sig) => ({
          sig,
          len: getBarLength(sig),
          sec: getTimeSec(chart.currentLevel!.freeze.bpmChanges, sig.step),
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
      {chart?.currentLevel && (
        <div
          className="absolute border-l border-amber-400 shadow shadow-yellow-400"
          style={{
            top: -2.5 * rem,
            bottom: -5 * rem,
            left: timeBarPos(chart.currentLevel.current.timeSec + chart.offset),
          }}
        />
      )}
      {/* 現在時刻 */}
      {chart?.currentLevel && (
        <span
          className="absolute "
          style={{
            top: -2.5 * rem,
            left: timeBarPos(chart.currentLevel.current.timeSec + chart.offset),
          }}
        >
          {timeStr(chart.currentLevel.current.timeSec + chart.offset)}
        </span>
      )}
      {/* interpの場合現在speed */}
      {chart?.currentLevel?.freeze.speedChanges.at(
        chart.currentLevel.current.speedIndex + 1
      )?.interp && (
        <>
          <div
            className="absolute z-10"
            style={{
              bottom: -3.75 * rem,
              left: timeBarPos(
                chart.currentLevel.current.timeSec + chart.offset
              ),
            }}
          >
            <span
              className="absolute inset-y-0 left-0 m-auto h-0 border border-slate-800 dark:border-stone-300"
              style={{
                width:
                  timeBarPos(
                    chart.currentLevel.freeze.speedChanges.at(
                      chart.currentLevel.current.speedIndex + 1
                    )!.timeSec
                  ) - timeBarPos(chart.currentLevel.current.timeSec),
              }}
            />
            <span
              className="absolute inset-y-0 right-full m-auto h-0 border border-slate-800 dark:border-stone-300"
              style={{
                width:
                  timeBarPos(chart.currentLevel.current.timeSec) -
                  timeBarPos(
                    chart.currentLevel.freeze.speedChanges.at(
                      chart.currentLevel.current.speedIndex
                    )!.timeSec
                  ),
              }}
            />
            <span className="inline-block -translate-x-1/2 px-1 rounded-md bg-white/25 dark:bg-stone-800/15 backdrop-blur-2xs">
              {(
                chart.currentLevel.freeze.speedChanges.at(
                  chart.currentLevel.current.speedIndex
                )!.bpm +
                ((chart.currentLevel.freeze.speedChanges.at(
                  chart.currentLevel.current.speedIndex + 1
                )!.bpm -
                  chart.currentLevel.freeze.speedChanges.at(
                    chart.currentLevel.current.speedIndex
                  )!.bpm) /
                  (chart.currentLevel.freeze.speedChanges.at(
                    chart.currentLevel.current.speedIndex + 1
                  )!.timeSec -
                    chart.currentLevel.freeze.speedChanges.at(
                      chart.currentLevel.current.speedIndex
                    )!.timeSec)) *
                  (chart.currentLevel.current.timeSec -
                    chart.currentLevel.freeze.speedChanges.at(
                      chart.currentLevel.current.speedIndex
                    )!.timeSec)
              ).toFixed(2)}
            </span>
          </div>
        </>
      )}
      {/* にこちゃんの位置 */}
      {chart?.currentLevel?.seqNotes.map(
        (n) =>
          n.hitTimeSec + chart.offset > timeBarBeginSec &&
          n.hitTimeSec + chart.offset <
            timeBarBeginSec + timeBarWidth / timeBarPxPerSec &&
          // 同じ位置に2つ以上の音符を重ねない
          n.hitTimeSec !==
            chart.currentLevel?.seqNotes.at(n.id + 1)?.hitTimeSec && (
            <span
              key={n.id}
              className={clsx(
                "absolute rounded-full",
                n.hitTimeSec === chart.currentLevel?.currentSeqNote?.hitTimeSec
                  ? "bg-red-400"
                  : "bg-yellow-400"
              )}
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
                  const length = chart
                    .currentLevel!.seqNotes.slice(0, n.id)
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
