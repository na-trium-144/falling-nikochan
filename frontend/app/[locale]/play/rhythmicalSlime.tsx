"use client";
import { useEffect, useRef, useState } from "react";
import { BPMChange, BPMChange1, Signature5 } from "@falling-nikochan/chart";
import { Signature } from "@falling-nikochan/chart";
import { getSignatureState, getTimeSec } from "@falling-nikochan/chart";
import { Step, stepAdd, stepSub, stepZero } from "@falling-nikochan/chart";
import { useDisplayMode } from "@/scale.js";
import { SlimeSVG } from "@/common/slime";

interface Props {
  className?: string;
  style?: object;
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  bpmChanges?: BPMChange[] | BPMChange1[];
  signature: Signature[] | Signature5[];
}
interface SlimeState {
  // 対象の時刻の3/6ステップ前からしゃがむ
  // 対象の時刻の1/6ステップ前からジャンプしはじめ、
  // 対象の時刻の1/6ステップ後に最高点、
  // 3/6ステップ後に着地
  preparingSec: number;
  jumpBeginSec: number;
  jumpMidSec: number;
  landingSec: number;
  animDuration: number;
}
export default function RhythmicalSlime(props: Props) {
  const { playing, getCurrentTimeSec, bpmChanges } = props;
  const step = useRef<Step>(stepZero());
  const lastPreparingSec = useRef<number | null>(null);
  const [maxSlimeNum, setMaxSlimeNum] = useState<number>(0);
  const [currentBar, setCurrentBar] = useState<(4 | 8 | 16)[]>([]);
  const [slimeStates, setSlimeStates] = useState<(SlimeState | undefined)[]>(
    []
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (playing) {
      const nextStep = () => {
        const now = getCurrentTimeSec();
        while (now !== undefined && playing && bpmChanges) {
          if (lastPreparingSec.current != null && lastPreparingSec.current > now) {
            timer = setTimeout(nextStep, (lastPreparingSec.current - now) * 1000);
            return;
          }
          const ss = getSignatureState(props.signature, step.current);
          step.current = ss.stepAligned;
          const slimeIndex = ss.count.fourth;
          const slimeSize = ss.bar[slimeIndex];
          const slimeSizeStep = {
            fourth: 0,
            numerator: 1,
            denominator: slimeSize / 4,
          };
          if (
            currentBar.length !== ss.bar.length ||
            !currentBar.every((v, i) => v === ss.bar[i])
          ) {
            const barChangeSec = getTimeSec(bpmChanges, ss.stepAligned);
            const barChange = () => {
              setMaxSlimeNum((num) => Math.max(num, ss.bar.length));
              setCurrentBar(ss.bar);
            };
            if (barChangeSec > now) {
              setTimeout(barChange, (barChangeSec - now) * 1000);
            } else {
              barChange();
            }
          }
          const jumpBeginSec = getTimeSec(
            bpmChanges,
            stepSub(ss.stepAligned, {
              fourth: 0,
              numerator: 1,
              denominator: (slimeSize / 4) * 6,
            })
          );
          const landingSec = getTimeSec(
            bpmChanges,
            stepAdd(ss.stepAligned, {
              fourth: 0,
              numerator: 3,
              denominator: (slimeSize / 4) * 6,
            })
          );
          const jumpMidSec = (jumpBeginSec + landingSec) / 2;
          const animDuration = ((landingSec - jumpBeginSec) / 4) * 8;
          const preparingSec = jumpBeginSec - (animDuration * 2) / 8;
          lastPreparingSec.current = preparingSec;
          setSlimeStates((states) => {
            const newStates = [...states];
            while (slimeIndex >= newStates.length) {
              newStates.push(undefined);
            }
            newStates[slimeIndex] = {
              preparingSec,
              jumpBeginSec,
              jumpMidSec,
              landingSec,
              animDuration,
            };
            return newStates;
          });
          step.current = stepAdd(ss.stepAligned, slimeSizeStep);
        }
      };
      nextStep();
      return () => {
        if (timer !== null) {
          clearTimeout(timer);
        }
      };
    } else {
      step.current = stepZero();
      lastPreparingSec.current = null;
      setSlimeStates([]);
      setMaxSlimeNum((num) =>
        Math.max(num, props.signature[0]?.bars[0].length)
      );
      setCurrentBar(props.signature[0]?.bars[0] || []);
    }
  }, [bpmChanges, playing, getCurrentTimeSec, currentBar, props.signature]);

  const { playUIScale } = useDisplayMode();

  return (
    <div
      className={props.className + " flex flex-row-reverse "}
      style={props.style}
    >
      {Array.from(new Array(maxSlimeNum)).map((_, i) => (
        <Slime
          key={i}
          exists={i < currentBar.length}
          size={currentBar[i] || 4}
          state={slimeStates[i]}
          getCurrentTimeSec={getCurrentTimeSec}
          playUIScale={playUIScale}
        />
      ))}
    </div>
  );
}

interface PropsS {
  getCurrentTimeSec: () => number | undefined;
  size: 4 | 8 | 16;
  exists: boolean;
  state?: SlimeState;
  playUIScale: number;
}
function Slime(props: PropsS) {
  const prevJumpMid = useRef<number | null>(null);
  const [jumpingMidDate, setJumpingMidDate] = useState<Date | null>(null);
  const durationSec = useRef<number>(0);
  useEffect(() => {
    const now = props.getCurrentTimeSec();
    if (now === undefined || props.state === undefined) {
      setJumpingMidDate(null);
    } else if (prevJumpMid.current !== props.state.jumpMidSec) {
      prevJumpMid.current = props.state.jumpMidSec;
      durationSec.current = props.state.animDuration;
      setJumpingMidDate(
        new Date(new Date().getTime() + (props.state.jumpMidSec - now) * 1000)
      );
    }
  }, [props]);
  return (
    <span
      className="relative "
      style={{
        width:
          (props.size === 4 ? 1 : props.size === 8 ? 0.75 : 0.5) *
          54 *
          props.playUIScale,
        marginLeft: 0 * props.playUIScale,
      }}
    >
      <SlimeSVG
        className="absolute inset-x-0 bottom-0 "
        appearingAnim
        hidden={!props.exists}
        jumpingMid={jumpingMidDate}
        duration={durationSec.current}
        noLoop
      />
    </span>
  );
}
