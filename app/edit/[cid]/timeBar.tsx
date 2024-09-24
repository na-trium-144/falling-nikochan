"use client";

import {
  findBpmIndexFromStep,
  getStep,
  getTimeSec,
  Note,
} from "@/chartFormat/seq";
import { useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { stepNStr, timeSecStr, timeStr } from "./str";
import { Step, stepAdd, stepCmp, stepZero } from "@/chartFormat/step";
import { Chart } from "@/chartFormat/chart";
import msgpack from "@ygoe/msgpack";
import { ColorRGBA, WebglLine, WebglPlot } from "webgl-plot";

interface Props {
  currentTimeSecWithoutOffset: number;
  currentNoteIndex: number;
  currentStep: Step;
  chart?: Chart;
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
    notesAll,
    snapDivider,
    ytId,
    timeBarPxPerSec,
  } = props;

  const [sampledWave, setSampledWave] = useState<number[]>();
  const [waveLoading, setWaveLoading] = useState<boolean>(false);
  const [waveFetchErrorStatus, setWaveFetchErrorStatus] = useState<number>();
  const [waveFetchErrorMsg, setWaveFetchErrorMsg] = useState<string>();
  useEffect(() => {
    void (async () => {
      setWaveLoading(true);
      const res = await fetch(`/api/wave/${ytId}`, { cache: "no-store" });
      setWaveLoading(false);
      if (res.ok) {
        setSampledWave(msgpack.deserialize(await res.arrayBuffer()));
      } else {
        setWaveFetchErrorStatus(res.status);
        try {
          setWaveFetchErrorMsg((await res.json()).message);
        } catch (e) {
          setWaveFetchErrorMsg(String(e));
        }
      }
    })();
  }, [ytId]);

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
    timeBarPxPerSec,
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

  const canvasMain = useRef<HTMLCanvasElement>(null!);
  useEffect(() => {
    let webglp: WebglPlot | null = null;
    const line: WebglLine = new WebglLine(new ColorRGBA(0, 0.6, 0, 1), 1000);
    line.arrangeX();

    if (canvasMain.current && sampledWave) {
      let id = 0;
      let renderPlot = () => {
        if (
          webglp == null ||
          canvasMain.current.width != timeBarRef.current.clientWidth ||
          canvasMain.current.height !== timeBarRef.current.clientHeight
        ) {
          canvasMain.current.width = timeBarRef.current.clientWidth;
          canvasMain.current.height = timeBarRef.current.clientHeight;

          webglp = new WebglPlot(canvasMain.current);
          webglp.addLine(line);
        }

        let maxY = 1;
        for (let i = 0; i < line.numPoints; i++) {
          // 最大numPoints個の点しか描画できない
          const t1 =
            timeBarBeginSec +
            ((i / line.numPoints) * timeBarWidth) / timeBarPxPerSec;
          const t2 =
            timeBarBeginSec +
            (((i + 1) / line.numPoints) * timeBarWidth) / timeBarPxPerSec;

          let y: number = 0;
          if (t1 >= 0 && t2 >= 0) {
            y = Math.max(
              ...sampledWave.slice(Math.floor(t1 * 1000), Math.floor(t2 * 1000))
            );
          }
          line.setY(i, y);
          maxY = Math.max(maxY, y);
        }
        line.offsetY = -1;
        line.scaleY = 2 / maxY;
        id = requestAnimationFrame(renderPlot);
        webglp.update();
      };
      id = requestAnimationFrame(renderPlot);

      return () => {
        renderPlot = () => undefined;
        cancelAnimationFrame(id);
      };
    }
  }, [sampledWave, timeBarBeginSec, timeBarRef, timeBarWidth]);

  return (
    <div
      className={"h-6 bg-gray-200 relative mt-12 mb-10 overflow-visible"}
      ref={timeBarRef}
    >
      {waveLoading && <span className="absolute loader" />}
      {waveFetchErrorStatus && (
        <span className="absolute">
          {waveFetchErrorStatus}: {waveFetchErrorMsg}
        </span>
      )}
      <canvas className="absolute " ref={canvasMain} />
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
                  "absolute rounded-full " +
                  (n.id === currentNoteIndex ? "bg-red-400 " : "bg-yellow-400 ")
                }
                style={{
                  width: n.big ? 18 : 12,
                  height: n.big ? 18 : 12,
                  top: 12 - (n.big ? 9 : 6),
                  left: timeBarPos(n.hitTimeSec + chart.offset) - (n.big ? 9 : 6),
                }}
              />
            )
        )}
    </div>
  );
}
