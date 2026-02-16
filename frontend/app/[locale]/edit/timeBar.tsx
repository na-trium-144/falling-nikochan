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
import { Fragment, useCallback, useEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import { timeSecStr, timeStr } from "./str.js";
import { useDisplayMode } from "@/scale.js";
import { getBarLength } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";

interface Props {
  chart?: ChartEditing;
  setAndSeekCurrentTimeWithoutOffset: (
    timeSec: number,
    focus?: boolean,
    allowSeekAhead?: boolean
  ) => void;
}
export default function TimeBar(props: Props) {
  const t = useTranslations("edit.timeBar");
  const { chart, setAndSeekCurrentTimeWithoutOffset } = props;
  const currentLevel = chart?.currentLevel;
  const cur = currentLevel?.current;
  const { rem } = useDisplayMode();

  const timeBarResize = useResizeDetector<HTMLDivElement>();
  const timeBarWidth = timeBarResize.width || 500;
  const timeBarRef = timeBarResize.ref;
  const zoomPxPerSec = useCallback(
    () => 300 * Math.pow(1.5, chart?.zoom ?? 0),
    [chart]
  );
  // timebar上の位置を計算
  const timeBarPos = (timeSec: number) => timeSec * zoomPxPerSec();

  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUserScrolled = useCallback(() => {
    if (
      cur &&
      chart &&
      Math.abs(
        (timeBarRef.current?.scrollLeft ?? 0) / zoomPxPerSec() -
          (cur.timeSec + chart.offset)
      ) > 0.01
    ) {
      if (scrollTimeout.current !== null) {
        clearTimeout(scrollTimeout.current);
      }
      setAndSeekCurrentTimeWithoutOffset(
        (timeBarRef.current?.scrollLeft ?? 0) / zoomPxPerSec(),
        true,
        false
      );
      scrollTimeout.current = setTimeout(() => {
        scrollTimeout.current = null;
        setAndSeekCurrentTimeWithoutOffset(
          (timeBarRef.current?.scrollLeft ?? 0) / zoomPxPerSec(),
          true,
          true
        );
      }, 100);
    }
  }, [
    setAndSeekCurrentTimeWithoutOffset,
    zoomPxPerSec,
    timeBarRef,
    chart,
    cur,
  ]);
  useEffect(() => {
    const scrollTimeBar = () => {
      if (cur && chart) {
        timeBarRef.current?.scrollTo({
          left: (cur.timeSec + chart.offset) * zoomPxPerSec(),
        });
      }
    };
    scrollTimeBar();
    chart?.on("rerender", scrollTimeBar);
    return () => {
      chart?.off("rerender", scrollTimeBar);
    };
  }, [chart, cur, timeBarRef, zoomPxPerSec]);

  const timeBarBeginStep =
    chart && currentLevel && cur
      ? stepAdd(
          getStep(
            currentLevel.freeze.bpmChanges,
            cur.timeSec - timeBarWidth / 2 / zoomPxPerSec(),
            currentLevel.meta.snapDivider
          ),
          {
            fourth: 0,
            numerator: -1,
            denominator: currentLevel.meta.snapDivider,
          }
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
        denominator: currentLevel.meta.snapDivider,
      });
      const t = getTimeSec(currentLevel.freeze.bpmChanges, s) + chart.offset;
      if (
        t - (cur.timeSec + chart.offset) <
        timeBarWidth / 2 / zoomPxPerSec()
      ) {
        timeBarSteps.push({ step: s, timeSec: t });
      } else {
        break;
      }
    }
  }

  return (
    <div className="relative w-full **:leading-4">
      <div
        className="min-w-0 w-full overflow-x-auto overflow-y-clip"
        ref={timeBarRef}
        onScroll={onUserScrolled}
      >
        <div
          className={clsx("relative mt-10 mb-20 h-6 overflow-visible")}
          style={{
            marginLeft: timeBarWidth / 2,
            marginRight: timeBarWidth, // / 2,
            width:
              Math.max(
                currentLevel?.meta.ytEndSec ?? 0,
                (cur?.timeSec ?? 0) + (chart?.offset ?? 0)
              ) * zoomPxPerSec(),
          }}
        >
          <div
            className="absolute inset-0 bg-gray-500/15"
            style={{
              marginLeft: -timeBarWidth / 2,
              marginRight: -timeBarWidth,
            }}
          />
          <div
            className="absolute inset-y-0 bg-gray-500/20"
            style={{
              marginLeft: (currentLevel?.meta.ytBegin ?? 0) * zoomPxPerSec(),
              width:
                ((currentLevel?.meta.ytEndSec ?? 0) -
                  (currentLevel?.meta.ytBegin ?? 0)) *
                zoomPxPerSec(),
            }}
          />
          {/* 秒数目盛り */}
          {Array.from(
            new Array(Math.ceil(timeBarWidth / 2 / zoomPxPerSec()))
          ).map((_, dt) => (
            <Fragment
              key={Math.round((cur?.timeSec ?? 0) + (chart?.offset ?? 0)) + dt}
            >
              <span
                className="absolute border-l border-gray-500 "
                style={{
                  top: -1.25 * rem,
                  bottom: -4,
                  left: timeBarPos(
                    Math.round((cur?.timeSec ?? 0) + (chart?.offset ?? 0)) + dt
                  ),
                }}
              >
                {timeSecStr(
                  Math.round((cur?.timeSec ?? 0) + (chart?.offset ?? 0)) + dt
                )}
              </span>
              {dt !== 0 && (
                <span
                  className="absolute border-l border-gray-500 "
                  style={{
                    top: -1.25 * rem,
                    bottom: -4,
                    left: timeBarPos(
                      Math.round((cur?.timeSec ?? 0) + (chart?.offset ?? 0)) -
                        dt
                    ),
                  }}
                >
                  {timeSecStr(
                    Math.round((cur?.timeSec ?? 0) + (chart?.offset ?? 0)) - dt
                  )}
                </span>
              )}
            </Fragment>
          ))}
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
                            {ss.count.fourth === 0 &&
                              (ss.barNum + 1).toString()}
                            ;{ss.count.fourth + 1}
                          </>
                        )}
                      </span>
                    </span>
                  )
              )}
          {/* bpm変化 */}
          {chart &&
            currentLevel?.freeze.bpmChanges.map((ch, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  bottom: -2.5 * rem,
                  left: timeBarPos(ch.timeSec + chart.offset),
                }}
              >
                <span className="absolute bottom-0 w-max">{ch.bpm}</span>
              </span>
            ))}
          {/* speed変化 */}
          {chart &&
            currentLevel?.freeze.speedChanges.map((ch, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  bottom: -3.75 * rem,
                  left: timeBarPos(ch.timeSec + chart.offset),
                }}
              >
                <span className="absolute bottom-0 w-max">
                  {ch.bpm}
                  {currentLevel!.freeze.speedChanges[i + 1]?.interp && (
                    <span
                      className="absolute inset-y-0 left-0 m-auto h-0 border border-base"
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
                      className="absolute inset-y-0 right-full m-auto h-0 border border-base"
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
            ))}
          {/* signature変化 */}
          {chart &&
            currentLevel?.freeze.signature
              .map((sig) => ({
                sig,
                len: getBarLength(sig),
                sec: getTimeSec(currentLevel!.freeze.bpmChanges, sig.step),
              }))
              .map(({ len, sec }, i) => (
                <span
                  key={i}
                  className="absolute w-max border-l-2 border-slate-600 dark:border-stone-400 "
                  style={{
                    top: -4,
                    bottom: -5 * rem,
                    left: timeBarPos(sec + chart.offset),
                  }}
                >
                  <span className="absolute bottom-0 w-max">
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
              ))}
          {/* にこちゃんの位置 */}
          {chart &&
            cur &&
            currentLevel?.seqNotes.map(
              (n) =>
                n.hitTimeSec + chart.offset >
                  cur.timeSec + chart.offset - timeBarWidth / zoomPxPerSec() &&
                n.hitTimeSec + chart.offset <
                  cur.timeSec + chart.offset + timeBarWidth / zoomPxPerSec() &&
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
                          .filter(
                            (n2) => n.hitTimeSec === n2.hitTimeSec
                          ).length;
                        return length > 0 ? length + 1 : null;
                      })()}
                    </span>
                  </span>
                )
            )}
        </div>
      </div>
      {/* 現在位置カーソル */}
      {currentLevel && cur && (
        <div className="absolute inset-0 h-full w-0 m-auto pointer-events-none">
          <div
            className={clsx(
              "absolute inset-0 z-1",
              "border-l border-amber-400 shadow shadow-yellow-400"
            )}
          />
          {/* 現在時刻 */}
          <span
            className="absolute "
            style={{
              top: 0 * rem,
              left: 0,
            }}
          >
            {timeStr(cur.timeSec + chart.offset)}
          </span>
          <div className="absolute top-10 bottom-20">
            {/* 現在bpm */}
            <div
              className="absolute w-max px-1 rounded-md backdrop-blur-2xs"
              style={{
                bottom: -2.5 * rem,
                right: 0,
              }}
            >
              {t("bpm")}:
            </div>
            <div
              className="absolute w-max pr-1 rounded-md backdrop-blur-2xs"
              style={{
                bottom: -2.5 * rem,
                left: 0,
              }}
            >
              {currentLevel.currentBpm}
            </div>
            {/* 現在speed */}
            <div
              className="absolute w-max px-1 rounded-md backdrop-blur-2xs"
              style={{
                bottom: -3.75 * rem,
                right: 0,
              }}
            >
              {t("speed")}:
            </div>
            <div
              className={clsx(
                "absolute w-max pr-1 rounded-md backdrop-blur-2xs",
                currentLevel.nextSpeedInterp &&
                  clsx(
                    "-translate-x-1.5 px-1.5 translate-y-0.5 py-0.5",
                    "bg-white/50 dark:bg-stone-700/50",
                    "text-amber-600 dark:text-amber-400"
                  )
              )}
              style={{
                bottom: -3.75 * rem,
                left: 0,
              }}
            >
              {currentLevel.nextSpeedInterp
                ? (
                    currentLevel.currentSpeed! +
                    ((currentLevel.nextSpeed! - currentLevel.currentSpeed!) /
                      (currentLevel.nextSpeedChange!.timeSec -
                        currentLevel.currentSpeedChange!.timeSec)) *
                      (cur.timeSec - currentLevel.currentSpeedChange!.timeSec)
                  ).toFixed(2)
                : currentLevel.currentSpeed}
            </div>
            {/*signature*/}
            <div
              className="absolute w-max px-1 rounded-md backdrop-blur-2xs"
              style={{
                bottom: -5 * rem,
                right: 0,
              }}
            >
              {t("beat")}:
            </div>
            <div
              className="absolute w-max pr-1 rounded-md backdrop-blur-2xs"
              style={{
                bottom: -5 * rem,
                left: 0,
              }}
            >
              {currentLevel.currentSignature &&
                getBarLength(currentLevel.currentSignature).map((len, i) => (
                  <Fragment key={i}>
                    {i >= 1 && <span className="mx-0.5">+</span>}
                    <span>{stepImproper(len)}</span>
                    <span>/</span>
                    <span>{len.denominator * 4}</span>
                  </Fragment>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
