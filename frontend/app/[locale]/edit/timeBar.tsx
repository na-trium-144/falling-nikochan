"use client";

import clsx from "clsx/lite";
import {
  ChartEditing,
  ChartSeqData,
  findBpmIndexFromSec,
  findBpmIndexFromStep,
  getBarLength,
  getSignatureState,
  getStep,
  getTimeSec,
  Step,
  stepAdd,
  stepCmp,
  stepImproper,
  stepZero,
  updateBarNum,
} from "@falling-nikochan/chart";
import {
  Fragment,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useResizeDetector } from "react-resize-detector";
import { timeSecStr, timeStr } from "./str.js";
import { useDisplayMode } from "@/scale.js";
import { useTranslations } from "next-intl";
import { Scrollable } from "@/common/scrollable.jsx";

export type TimeBarProps = {
  setAndSeekCurrentTimeWithoutOffset: (
    timeSec: number,
    focus?: boolean,
    allowSeekAhead?: boolean
  ) => void;
  zoom?: number;
  isNoteSelected?: (n: {
    id: number;
    hitTimeSec: number;
    step: Step;
  }) => boolean;
} & (
  | {
      chart?: ChartEditing;
      chartSeq?: never;
      currentTimeSec?: never;
    }
  | {
      chart?: never;
      chartSeq?: ChartSeqData;
      currentTimeSec?: number;
    }
);

const DRAG_THRESHOLD_PX = 1;
const DRAG_CLICK_SUPPRESSION_MS = 100;

export default function TimeBar(props: TimeBarProps) {
  const t = useTranslations("edit.timeBar");
  const { setAndSeekCurrentTimeWithoutOffset } = props;
  const chart = props.chart;
  const chartSeq = props.chartSeq;
  const currentLevel = chart?.currentLevel;
  const cur = currentLevel?.current;

  const offset = chart ? chart.offset : (chartSeq?.offset ?? 0);
  const currentTimeSec = chart
    ? (cur?.timeSec ?? 0)
    : (props.currentTimeSec ?? 0);
  const zoomLevel = props.zoom ?? chart?.zoom ?? 0;

  const { rem } = useDisplayMode();
  const [draggingTimeBar, setDraggingTimeBar] = useState(false);

  const timeBarResize = useResizeDetector<HTMLDivElement>();
  const timeBarWidth = timeBarResize.width || 500;
  const timeBarRef = timeBarResize.ref;
  const zoomPxPerSec = useCallback(
    () => 300 * Math.pow(1.5, zoomLevel),
    [zoomLevel]
  );
  // timebar上の位置を計算
  const timeBarPos = (timeSec: number) => timeSec * zoomPxPerSec();

  const bpmChanges = chart
    ? (currentLevel?.freeze.bpmChanges ?? [])
    : (chartSeq?.bpmChanges ?? []);
  const speedChanges = chart
    ? (currentLevel?.freeze.speedChanges ?? [])
    : (chartSeq?.speedChanges ?? []);
  const signature = useMemo(
    () =>
      chart
        ? (currentLevel?.freeze.signature ?? [])
        : chartSeq
          ? updateBarNum(chartSeq.signature)
          : [],
    [chart, currentLevel, chartSeq]
  );
  const seqNotes = chart
    ? (currentLevel?.seqNotes ?? [])
    : (chartSeq?.notes ?? []);
  const ytBegin = chart
    ? (currentLevel?.meta.ytBegin ?? 0)
    : (chartSeq?.ytBegin ?? 0);
  const ytEndSec = chart
    ? (currentLevel?.meta.ytEndSec ?? 0)
    : (chartSeq?.ytEndSec ?? 0);
  const snapDivider = chart ? currentLevel?.meta.snapDivider || 1 : 1;

  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNoteClickUntil = useRef(0);
  const onUserScrolled = useCallback(() => {
    if (
      (chart || chartSeq) &&
      Math.abs(
        (timeBarRef.current?.scrollLeft ?? 0) / zoomPxPerSec() -
          (currentTimeSec + offset)
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
    chartSeq,
    currentTimeSec,
    offset,
  ]);

  useEffect(() => {
    const scrollTimeBar = () => {
      if (chart || chartSeq) {
        timeBarRef.current?.scrollTo({
          left: (currentTimeSec + offset) * zoomPxPerSec(),
        });
      }
    };
    scrollTimeBar();
    if (chart) {
      chart.on("rerender", scrollTimeBar);
      return () => {
        chart.off("rerender", scrollTimeBar);
      };
    }
  }, [chart, chartSeq, cur, currentTimeSec, offset, timeBarRef, zoomPxPerSec]);

  useEffect(() => {
    const timeBar = timeBarRef.current;
    if (!timeBar) return;
    let dragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let dragged = false;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      setDraggingTimeBar(true);
      dragged = false;
      dragStartX = e.clientX;
      dragStartScrollLeft = timeBar.scrollLeft;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > DRAG_THRESHOLD_PX) {
        dragged = true;
      }
      timeBar.scrollLeft = dragStartScrollLeft - dx;
      e.preventDefault();
    };
    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      setDraggingTimeBar(false);
      if (dragged) {
        suppressNoteClickUntil.current = Date.now() + DRAG_CLICK_SUPPRESSION_MS;
      }
    };

    timeBar.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("blur", onMouseUp);
    return () => {
      timeBar.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("blur", onMouseUp);
      setDraggingTimeBar(false);
    };
  }, [timeBarRef]);

  const currentStep = chart
    ? (cur?.step ?? stepZero())
    : getStep(bpmChanges, currentTimeSec, 4);

  const timeBarBeginStep =
    chart || chartSeq
      ? stepAdd(
          getStep(
            bpmChanges,
            currentTimeSec - timeBarWidth / 2 / zoomPxPerSec(),
            snapDivider
          ),
          {
            fourth: 0,
            numerator: -1,
            denominator: snapDivider,
          }
        )
      : stepZero();

  // timebarに表示するstep目盛りのリスト
  const timeBarSteps: { step: Step; timeSec: number }[] = [];
  if (chart || chartSeq) {
    timeBarSteps.push({
      step: timeBarBeginStep,
      timeSec: getTimeSec(bpmChanges, timeBarBeginStep),
    });
    while (true) {
      const s = stepAdd(timeBarSteps[timeBarSteps.length - 1].step, {
        fourth: 0,
        numerator: 1,
        denominator: snapDivider,
      });
      const t = getTimeSec(bpmChanges, s) + offset;
      if (t - (currentTimeSec + offset) < timeBarWidth / 2 / zoomPxPerSec()) {
        timeBarSteps.push({ step: s, timeSec: t });
      } else {
        break;
      }
    }
  }

  const isNoteSelected = (n: {
    id: number;
    hitTimeSec: number;
    step: Step;
  }) => {
    if (props.isNoteSelected) {
      return props.isNoteSelected(n);
    }
    if (chart && currentLevel) {
      return n.hitTimeSec === currentLevel.currentSeqNote?.hitTimeSec;
    }
    return false;
  };

  const currentBpm = chart
    ? (currentLevel?.currentBpm ?? 120)
    : (bpmChanges[findBpmIndexFromSec(bpmChanges, currentTimeSec)]?.bpm ?? 120);

  const currentSpeed = chart
    ? (currentLevel?.currentSpeed ?? 120)
    : (speedChanges[findBpmIndexFromSec(speedChanges, currentTimeSec)]?.bpm ??
      120);

  const currentSignature = chart
    ? currentLevel?.currentSignature
    : signature[findBpmIndexFromStep(signature, currentStep)];

  const barTop = 2.5 * rem;
  const barHeight = 1.5 * rem;
  const barBottom = 6 * rem; // including scrollbar

  return (
    <div className="relative w-full **:leading-4">
      <Scrollable
        className={clsx(
          "min-w-0 w-full overflow-x-scroll overflow-y-visible",
          draggingTimeBar ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ height: barTop + barHeight + barBottom }}
        ref={timeBarRef as RefObject<HTMLDivElement>}
        onScroll={onUserScrolled}
        scrollableX
        convertDeltaYToX
      >
        <div
          className={clsx("relative overflow-visible")}
          style={{
            marginTop: barTop,
            height: barHeight,
            marginLeft: timeBarWidth / 2,
            marginRight: timeBarWidth,
            width:
              Math.max(ytEndSec ?? 0, (currentTimeSec ?? 0) + (offset ?? 0)) *
              zoomPxPerSec(),
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
              marginLeft: (ytBegin ?? 0) * zoomPxPerSec(),
              width: ((ytEndSec ?? 0) - (ytBegin ?? 0)) * zoomPxPerSec(),
            }}
          />
          {/* 秒数目盛り */}
          {Array.from(
            new Array(Math.ceil(timeBarWidth / 2 / zoomPxPerSec()))
          ).map((_, dt) => (
            <Fragment
              key={Math.round((currentTimeSec ?? 0) + (offset ?? 0)) + dt}
            >
              <span
                className="absolute border-l border-gray-500 "
                style={{
                  top: -1.25 * rem,
                  bottom: -4,
                  left: timeBarPos(
                    Math.round((currentTimeSec ?? 0) + (offset ?? 0)) + dt
                  ),
                }}
              >
                {timeSecStr(
                  Math.round((currentTimeSec ?? 0) + (offset ?? 0)) + dt
                )}
              </span>
              {dt !== 0 && (
                <span
                  className="absolute border-l border-gray-500 "
                  style={{
                    top: -1.25 * rem,
                    bottom: -4,
                    left: timeBarPos(
                      Math.round((currentTimeSec ?? 0) + (offset ?? 0)) - dt
                    ),
                  }}
                >
                  {timeSecStr(
                    Math.round((currentTimeSec ?? 0) + (offset ?? 0)) - dt
                  )}
                </span>
              )}
            </Fragment>
          ))}
          {/* step目盛り */}
          {(chart || chartSeq) &&
            timeBarSteps
              .map(({ step, timeSec }) => ({
                step,
                timeSec,
                ss: getSignatureState(signature, step),
              }))
              .map(
                ({ step, timeSec, ss }) =>
                  stepCmp(step, stepZero()) >= 0 && (
                    <span
                      key={timeSec}
                      className="absolute border-l border-red-400 dark:border-red-700 "
                      style={{
                        top: -4,
                        bottom: ss.count.numerator === 0 ? -1.25 * rem : -4,
                        left: timeBarPos(timeSec),
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
          {(chart || chartSeq) &&
            bpmChanges.map((ch, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  bottom: -2.5 * rem,
                  left: timeBarPos(ch.timeSec + offset),
                }}
              >
                <span className="absolute bottom-0 w-max">{ch.bpm}</span>
              </span>
            ))}
          {/* speed変化 */}
          {(chart || chartSeq) &&
            speedChanges.map((ch, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  bottom: -3.75 * rem,
                  left: timeBarPos(ch.timeSec + offset),
                }}
              >
                <span className="absolute bottom-0 w-max">
                  {ch.bpm}
                  {speedChanges[i + 1]?.interp && (
                    <span
                      className="absolute inset-y-0 left-0 m-auto h-0 border border-base"
                      style={{
                        width:
                          timeBarPos(speedChanges[i + 1].timeSec) -
                          timeBarPos(ch.timeSec),
                      }}
                    />
                  )}
                  {ch.interp && i >= 1 && (
                    <span
                      className="absolute inset-y-0 right-full m-auto h-0 border border-base"
                      style={{
                        width:
                          timeBarPos(ch.timeSec) -
                          timeBarPos(speedChanges[i - 1].timeSec),
                      }}
                    />
                  )}
                </span>
              </span>
            ))}
          {/* signature変化 */}
          {(chart || chartSeq) &&
            signature
              .map((sig) => ({
                sig,
                len: getBarLength(sig),
                sec: getTimeSec(bpmChanges, sig.step),
              }))
              .map(({ len, sec }, i) => (
                <span
                  key={i}
                  className="absolute w-max border-l-2 border-slate-600 dark:border-stone-400 "
                  style={{
                    top: -4,
                    bottom: -5 * rem,
                    left: timeBarPos(sec + offset),
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
          {(chart || chartSeq) &&
            seqNotes.map(
              (n) =>
                n.hitTimeSec + offset >
                  currentTimeSec + offset - timeBarWidth / zoomPxPerSec() &&
                n.hitTimeSec + offset <
                  currentTimeSec + offset + timeBarWidth / zoomPxPerSec() &&
                // 同じ位置に2つ以上の音符を重ねない
                n.hitTimeSec !== seqNotes.at(n.id + 1)?.hitTimeSec && (
                  <span
                    key={n.id}
                    className={clsx(
                      "absolute rounded-full cursor-pointer",
                      "transition duration-100",
                      "hover:brightness-110 hover:scale-110 active:brightness-125",
                      isNoteSelected(n) ? "bg-red-400" : "bg-yellow-400"
                    )}
                    onClick={() => {
                      if (Date.now() < suppressNoteClickUntil.current) return;
                      setAndSeekCurrentTimeWithoutOffset(n.hitTimeSec + offset);
                    }}
                    style={{
                      width: n.big ? "1.5rem" : "1rem",
                      height: n.big ? "1.5rem" : "1rem",
                      top: ((6 / 4 - (n.big ? 1.5 : 1)) * rem) / 2,
                      left:
                        timeBarPos(n.hitTimeSec + offset) -
                        ((n.big ? 1.5 : 1) * rem) / 2,
                    }}
                  >
                    {/* 重なっている音符の数 */}
                    <span
                      className="absolute inset-x-0 text-center"
                      style={{ top: n.big ? "0.125rem" : 0 }}
                    >
                      {(() => {
                        const length = seqNotes
                          .slice(0, n.id)
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
      </Scrollable>
      {/* 現在位置カーソル */}
      {(chart || chartSeq) && (
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
            {timeStr(currentTimeSec + offset)}
          </span>
          <div className="absolute" style={{ top: barTop, height: barHeight }}>
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
              {currentBpm}
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
                currentLevel?.nextSpeedInterp &&
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
              {currentLevel?.nextSpeedInterp && cur
                ? (
                    currentLevel.currentSpeed! +
                    ((currentLevel.nextSpeed! - currentLevel.currentSpeed!) /
                      (currentLevel.nextSpeedChange!.timeSec -
                        currentLevel.currentSpeedChange!.timeSec)) *
                      (cur.timeSec - currentLevel.currentSpeedChange!.timeSec)
                  ).toFixed(2)
                : currentSpeed}
            </div>
            {/* signature */}
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
              {currentSignature &&
                getBarLength(currentSignature).map((len, i) => (
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
