"use client";
import { useEffect, useRef, useState } from "react";
import { BPMChange } from "@/chartFormat/command";
import { getTimeSec } from "@/chartFormat/seq";

interface Props {
  className?: string;
  style?: object;
  num: number;
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  bpmChanges?: BPMChange[];
}
export default function RhythmicalSlime(props: Props) {
  const { num, playing, getCurrentTimeSec, bpmChanges } = props;
  const step = useRef<number>(-1);
  const [jumpingSlime, setJumpingSlime] = useState<number>(-1);
  const [preparingSlime, setPreparingSlime] = useState<number>(-1);
  const transitionTimeMSec = useRef<number>(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (playing) {
      const nextStep = () => {
        while (playing && bpmChanges) {
          step.current++;
          const step0 = getTimeSec(bpmChanges, step.current - 0.25);
          const step0_5 = getTimeSec(bpmChanges, step.current + 0.25);
          const step1 = getTimeSec(bpmChanges, step.current + 0.75);
          const now = getCurrentTimeSec();
          transitionTimeMSec.current = (step0_5 - step0) * 1000;
          const jumpSlime = step.current % num;
          if (now === undefined) {
            return;
          }
          if (now < step0) {
            timer = setTimeout(() => {
              timer = null;
              const now = getCurrentTimeSec();
              if (now === undefined) {
                return;
              }
              if (now < step0_5) {
                setPreparingSlime(-1);
                setJumpingSlime(jumpSlime);
                timer = setTimeout(() => {
                  timer = null;
                  const now = getCurrentTimeSec();
                  if (now === undefined) {
                    return;
                  }
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
    } else {
      step.current = -1;
    }
  }, [bpmChanges, num, playing, getCurrentTimeSec]);
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