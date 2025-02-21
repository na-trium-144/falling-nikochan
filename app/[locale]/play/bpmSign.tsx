"use client";

import { FourthNote } from "@/common/fourthNote.js";
import { useDisplayMode } from "@/scale.js";
import { useEffect, useRef, useState } from "react";
import { ChartSeqData8 } from "../../../chartFormat/legacy/seq8.js";
import { ChartSeqData6 } from "../../../chartFormat/legacy/seq6.js";
import { SmilingFace } from "@icon-park/react";

interface Props {
  chartSeq: ChartSeqData6 | ChartSeqData8;
  getCurrentTimeSec: () => number | undefined;
  hasExplicitSpeedChange: boolean;
}
export default function BPMSign(props: Props) {
  const { playUIScale } = useDisplayMode();
  const { chartSeq, getCurrentTimeSec, hasExplicitSpeedChange } = props;

  const prevTimeSec = useRef<number | undefined>(undefined);
  const [flip, setFlip] = useState<boolean>(false);

  // chart.bpmChanges 内の現在のインデックス
  const [currentBpmIndex, setCurrentBpmIndex] = useState<number>(0);
  const displayBpm = chartSeq.bpmChanges.at(currentBpmIndex)?.bpm;
  const nextBpmIndex = useRef<number | null>(null);

  const [currentSpeedIndex, setCurrentSpeedIndex] = useState<number>(0);
  const displaySpeed =
    "speedChanges" in chartSeq
      ? chartSeq.speedChanges.at(currentSpeedIndex)?.bpm
      : undefined;

  // bpmを更新
  useEffect(() => {
    const now = getCurrentTimeSec();
    if (
      prevTimeSec.current !== undefined &&
      now !== undefined &&
      now < prevTimeSec.current
    ) {
      setCurrentBpmIndex(0);
      setCurrentSpeedIndex(0);
      nextBpmIndex.current = null;
    } else {
      prevTimeSec.current = now;
      let timer: ReturnType<typeof setTimeout> | null = null;
      if (
        now !== undefined &&
        currentBpmIndex + 1 < chartSeq.bpmChanges.length
      ) {
        // chartのvalidateでtimesecは再計算されたことが保証されている
        const nextBpmChangeTime =
          chartSeq.bpmChanges[currentBpmIndex + 1].timeSec;
        timer = setTimeout(() => {
          timer = null;
          const prevBpm = chartSeq.bpmChanges[currentBpmIndex].bpm;
          const nextBpm = chartSeq.bpmChanges[currentBpmIndex + 1].bpm;
          if (nextBpmIndex.current !== null) {
            nextBpmIndex.current = currentBpmIndex + 1;
          } else if (Math.abs(prevBpm - nextBpm) >= 10) {
            setFlip(true);
            nextBpmIndex.current = currentBpmIndex + 1;
            setTimeout(() => {
              setCurrentBpmIndex(nextBpmIndex.current!);
              nextBpmIndex.current = null;
              setFlip(false);
            }, 100);
          } else {
            setCurrentBpmIndex(currentBpmIndex + 1);
          }
        }, (nextBpmChangeTime - now) * 1000 - 100);
      }
      return () => {
        if (timer !== null) {
          clearTimeout(timer);
        }
      };
    }
  }, [chartSeq, currentBpmIndex, getCurrentTimeSec, flip]); // <- flipは使っていないが意図的に追加している

  //speed変化はアニメーションなし
  useEffect(() => {
    const now = getCurrentTimeSec();
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (
      now !== undefined &&
      hasExplicitSpeedChange &&
      "speedChanges" in chartSeq &&
      currentSpeedIndex + 1 < chartSeq.speedChanges.length
    ) {
      const nextSpeedChangeTime =
        chartSeq.speedChanges[currentSpeedIndex + 1].timeSec;
      timer = setTimeout(() => {
        timer = null;
        setCurrentSpeedIndex(currentSpeedIndex + 1);
      }, (nextSpeedChangeTime - now) * 1000);
    }
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [chartSeq, currentSpeedIndex, getCurrentTimeSec]);

  return (
    <div
      className="-z-20 absolute origin-bottom-left"
      style={{
        bottom: "100%",
        left: "0.8rem",
        transform: playUIScale !== 1 ? `scale(${playUIScale})` : undefined,
      }}
    >
      <div
        className="absolute inset-0 m-auto w-3 bg-amber-700 dark:bg-amber-900 "
        style={{ borderRadius: "100%/6px" }}
      />
      <div
        className={
          "rounded-sm mb-6 py-1 px-1.5 overflow-hidden " +
          "bg-gradient-to-t from-amber-600 to-amber-500 " +
          "dark:from-amber-900 dark:to-amber-800 " +
          "border-b-2 border-r-2 border-amber-800 dark:border-amber-950 " +
          "transition-transform duration-100 " +
          (flip ? "scale-x-0 " : "scale-x-100 ")
        }
      >
        <div className={"flex flex-row items-baseline w-22 overflow-hidden "}>
          <span className="flex-none text-xl w-max">
            <FourthNote />
            <span className="ml-1.5">=</span>
          </span>
          <span className="flex-1 min-w-0 text-2xl flex flex-row items-baseline justify-end ">
            {displayBpm !== undefined && Math.floor(displayBpm)}
          </span>
          <span className="flex-none text-base w-3.5 overflow-visible">
            .{displayBpm !== undefined && Math.floor(displayBpm * 10) % 10}
          </span>
        </div>
        {hasExplicitSpeedChange && (
          <div
            className={
              "flex flex-row items-baseline w-15 m-auto overflow-visible "
            }
          >
            <span className="flex-none text-sm/3 w-max">
              <SmilingFace className="inline-block align-bottom " />
              <span className="ml-0.5">=</span>
            </span>
            <span className="flex-1 min-w-0 text-base/3 flex flex-row items-baseline justify-end ">
              {displaySpeed !== undefined && Math.floor(displaySpeed)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
