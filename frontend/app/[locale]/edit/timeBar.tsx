"use client";

import clsx from "clsx/lite";
import {
  ChartEditing,
  getSignatureState,
  getStep,
  getTimeSec,
  Step,
  stepAdd,
  stepCmp,
  stepImproper,
  stepZero,
} from "@falling-nikochan/chart";
import { Fragment, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import { timeSecStr, timeStr } from "./str.js";
import { useDisplayMode } from "@/scale.js";
import { getBarLength } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";

interface Props {
  chart?: ChartEditing;
  timeBarPxPerSec: number;
}
export default function TimeBar(props: Props) {
  const t = useTranslations("edit.timeBar");
  const { chart, timeBarPxPerSec } = props;
  const currentLevel = chart?.currentLevel;
  const cur = currentLevel?.current;
  const { rem } = useDisplayMode();

  const timeBarResize = useResizeDetector();
  const timeBarWidth = timeBarResize.width || 500;
  const timeBarRef = timeBarResize.ref;
  // timebar左端の時刻
  const timeBarBeginSec = useRef<number>(-1);
  const timeBarPxPerSecPrev = useRef<number>(timeBarPxPerSec);

  // timebar上の位置を計算
  const timeBarPos = (timeSec: number) =>
    (timeSec - timeBarBeginSec.current) * timeBarPxPerSec;
  const marginPxLeft = 4 * rem;

  if (currentLevel && cur) {
    const marginPxRight = timeBarWidth / 2;
    // 現在のカーソル位置中心に拡大縮小
    if (timeBarPxPerSecPrev.current !== timeBarPxPerSec) {
      timeBarBeginSec.current =
        cur.timeSec +
        chart.offset -
        (cur.timeSec + chart.offset - timeBarBeginSec.current) /
          (timeBarPxPerSec / timeBarPxPerSecPrev.current);
      timeBarPxPerSecPrev.current = timeBarPxPerSec;
    }
    if (
      cur.timeSec + chart.offset - timeBarBeginSec.current <
      marginPxLeft / timeBarPxPerSec
    ) {
      timeBarBeginSec.current =
        cur.timeSec + chart.offset - marginPxLeft / timeBarPxPerSec;
    } else if (
      cur.timeSec + chart.offset - timeBarBeginSec.current >
      (timeBarWidth - marginPxRight) / timeBarPxPerSec
    ) {
      timeBarBeginSec.current =
        cur.timeSec +
        chart.offset -
        (timeBarWidth - marginPxRight) / timeBarPxPerSec;
    }
  }
  const timeBarBeginStep =
    chart && currentLevel && cur
      ? getStep(
          currentLevel.freeze.bpmChanges,
          timeBarBeginSec.current - chart.offset,
          cur.snapDivider
        )
      : stepZero();

  // timebarに表示するstep目盛りのリスト
  const timeBarSteps: { step: Step; timeSec: number }[] = [];
  if (currentLevel && cur) {
    timeBarSteps.push({
      step: timeBarBeginStep,
      timeSec: getTimeSec(currentLevel.freeze.bpmChanges, timeBarBeginStep),
    });
    while (true) {
      const s = stepAdd(timeBarSteps[timeBarSteps.length - 1].step, {
        fourth: 0,
        numerator: 1,
        denominator: cur.snapDivider,
      });
      const t = getTimeSec(currentLevel.freeze.bpmChanges, s) + chart.offset;
      if (t - timeBarBeginSec.current < timeBarWidth / timeBarPxPerSec) {
        timeBarSteps.push({ step: s, timeSec: t });
      } else {
        break;
      }
    }
  }

  const beginBpmChange = currentLevel?.findBpmChangeFromStep(timeBarBeginStep);
  const beginSpeedChange =
    currentLevel?.findSpeedChangeFromStep(timeBarBeginStep);
  const beginSignature = currentLevel?.findSignatureFromStep(timeBarBeginStep);
  const beginBarLength =
    currentLevel && beginSignature && getBarLength(beginSignature);

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
              left: timeBarPos(Math.ceil(timeBarBeginSec.current) + dt),
            }}
          >
            {timeSecStr(Math.ceil(timeBarBeginSec.current) + dt)}
          </span>
        )
      )}
      {/* step目盛り 目盛りのリストは別で計算してある */}
      {currentLevel &&
        timeBarSteps
          .map(({ step, timeSec }) => ({
            step,
            timeSec,
            ss: getSignatureState(currentLevel!.freeze.signature, step),
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
        {beginBpmChange && <span>{beginBpmChange?.bpm.toString()}</span>}
      </div>
      {chart &&
        currentLevel?.freeze.bpmChanges.map(
          (ch, i) =>
            ch.timeSec + chart.offset >= timeBarBeginSec.current &&
            ch.timeSec + chart.offset <
              timeBarBeginSec.current + timeBarWidth / timeBarPxPerSec && (
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
        {beginSpeedChange && <span>{beginSpeedChange?.bpm.toString()}</span>}
      </div>
      {chart &&
        currentLevel?.freeze.speedChanges.map(
          (ch, i) =>
            ch.timeSec + chart.offset >= timeBarBeginSec.current &&
            ch.timeSec + chart.offset <
              timeBarBeginSec.current + timeBarWidth / timeBarPxPerSec && (
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
                  {currentLevel!.freeze.speedChanges[i + 1]?.interp && (
                    <span
                      className="absolute inset-y-0 left-0 m-auto h-0 border border-slate-800 dark:border-stone-300"
                      style={{
                        width:
                          timeBarPos(
                            currentLevel!.freeze.speedChanges[i + 1].timeSec
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
                            currentLevel!.freeze.speedChanges[i - 1].timeSec
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
          <Fragment key={i}>
            {i >= 1 && <span className="mx-0.5">+</span>}
            <span>{stepImproper(len)}</span>
            <span>/</span>
            <span>{len.denominator * 4}</span>
          </Fragment>
        ))}
      </div>
      {chart &&
        currentLevel?.freeze.signature
          .map((sig) => ({
            sig,
            len: getBarLength(sig),
            sec: getTimeSec(currentLevel!.freeze.bpmChanges, sig.step),
          }))
          .map(
            ({ len, sec }, i) =>
              sec + chart.offset >= timeBarBeginSec.current &&
              sec + chart.offset <
                timeBarBeginSec.current + timeBarWidth / timeBarPxPerSec && (
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
      {currentLevel && cur && (
        <div
          className="absolute border-l border-amber-400 shadow shadow-yellow-400"
          style={{
            top: -2.5 * rem,
            bottom: -5 * rem,
            left: timeBarPos(cur.timeSec + chart.offset),
          }}
        />
      )}
      {/* 現在時刻 */}
      {currentLevel && cur && (
        <span
          className="absolute "
          style={{
            top: -2.5 * rem,
            left: timeBarPos(cur.timeSec + chart.offset),
          }}
        >
          {timeStr(cur.timeSec + chart.offset)}
        </span>
      )}
      {/* interpの場合現在speed */}
      {currentLevel?.nextSpeedInterp && cur && chart && (
        <>
          <div
            className="absolute z-10"
            style={{
              bottom: -3.75 * rem,
              left: timeBarPos(cur.timeSec + chart.offset),
            }}
          >
            <span
              className="absolute inset-y-0 left-0 m-auto h-0 border border-slate-800 dark:border-stone-300"
              style={{
                width:
                  timeBarPos(currentLevel.nextSpeedChange!.timeSec) -
                  timeBarPos(cur.timeSec),
              }}
            />
            <span
              className="absolute inset-y-0 right-full m-auto h-0 border border-slate-800 dark:border-stone-300"
              style={{
                width:
                  timeBarPos(cur.timeSec) -
                  timeBarPos(currentLevel.currentSpeedChange!.timeSec),
              }}
            />
            <span className="inline-block -translate-x-1/2 px-1 rounded-md bg-white/25 dark:bg-stone-800/15 backdrop-blur-2xs">
              {(
                currentLevel.currentSpeed! +
                ((currentLevel.nextSpeed! - currentLevel.currentSpeed!) /
                  (currentLevel.nextSpeedChange!.timeSec -
                    currentLevel.currentSpeedChange!.timeSec)) *
                  (cur.timeSec - currentLevel.currentSpeedChange!.timeSec)
              ).toFixed(2)}
            </span>
          </div>
        </>
      )}
      {/* にこちゃんの位置 */}
      {chart &&
        currentLevel?.seqNotes.map(
          (n) =>
            n.hitTimeSec + chart.offset > timeBarBeginSec.current &&
            n.hitTimeSec + chart.offset <
              timeBarBeginSec.current + timeBarWidth / timeBarPxPerSec &&
            // 同じ位置に2つ以上の音符を重ねない
            n.hitTimeSec !==
              currentLevel?.seqNotes.at(n.id + 1)?.hitTimeSec && (
              <span
                key={n.id}
                className={clsx(
                  "absolute rounded-full",
                  n.hitTimeSec === currentLevel.currentSeqNote?.hitTimeSec
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
