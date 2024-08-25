"use client";
import { useEffect, useRef, useState } from "react";
import { BPMChange } from "@/chartFormat/command";
import { getTimeSec } from "@/chartFormat/seq";

interface Props {
  className?: string;
  style?: object;
  num: number;
  startDate: Date | null;
  bpmChanges?: BPMChange[];
}
export default function RhythmicalSlime(props: Props) {
  const { num, startDate, bpmChanges } = props;
  const step = useRef<number>(-1);
  const [jumpingSlime, setJumpingSlime] = useState<number>(-1);
  const [preparingSlime, setPreparingSlime] = useState<number>(-1);
  const transitionTimeMSec = useRef<number>(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const nextStep = () => {
      while (startDate && bpmChanges) {
        step.current++;
        const step0 = getTimeSec(bpmChanges, step.current - 0);
        const step0_5 = getTimeSec(bpmChanges, step.current + 0.5);
        const step1 = getTimeSec(bpmChanges, step.current + 1);
        const now = (new Date().getTime() - startDate.getTime()) / 1000;
        transitionTimeMSec.current = (step0_5 - step0) * 1000;
        const jumpSlime = step.current % num;
        if (now < step0) {
          timer = setTimeout(() => {
            const now = (new Date().getTime() - startDate.getTime()) / 1000;
            if (now < step0_5) {
              setPreparingSlime(-1);
              setJumpingSlime(jumpSlime);
              timer = setTimeout(() => {
                const now = (new Date().getTime() - startDate.getTime()) / 1000;
                if (now < step1) {
                  setPreparingSlime((jumpSlime + 1) % 4);
                  setJumpingSlime(-1);
                }
                nextStep();
              }, (step0_5 - now) * 1000);
            } else {
              nextStep();
            }
          }, (step0 - now) * 1000);
          break;
        } else {
          continue;
        }
      }
    };
    nextStep();
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [bpmChanges, num, startDate]);
  return (
    <div
      className={props.className + " flex flex-row-reverse "}
      style={props.style}
    >
      {Array.from(new Array(num)).map((_, i) => (
        <img
          key={i}
          src="/slime.svg"
          className={
            "transition-transform origin-bottom " +
            (jumpingSlime == i
              ? "ease-out -translate-y-6 scale-y-110 "
              : preparingSlime == i
              ? "ease-out translate-y-0 scale-y-75 "
              : "ease-in translate-y-0 scale-y-100 ")
          }
          style={{
            transitionDuration: Math.round(transitionTimeMSec.current) + "ms",
            height: 40,
            marginLeft: 8,
          }}
        />
      ))}
    </div>
  );
}
