"use client";
import { useEffect, useRef, useState } from "react";
import { BPMChange } from "@/../chartFormat/bpm.js";
import { Signature } from "@/../chartFormat/signature.js";
import { getSignatureState, getTimeSec } from "@/../chartFormat/seq.js";
import { Step, stepAdd, stepSub, stepZero } from "@/../chartFormat/step.js";
import { useDisplayMode } from "@/scale.js";
import "./rhythmicalSlime.css";

interface Props {
  className?: string;
  style?: object;
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  bpmChanges?: BPMChange[];
  signature: Signature[];
}
interface SlimeState {
  // 対象の時刻の3/4ステップ前からしゃがむ
  // 対象の時刻の1/4ステップ前からジャンプしはじめ、
  jumpBeginSec: number;
  // 対象の時刻の1/4ステップ後に最高点、
  jumpEndSec: number;
  // 3/4ステップ後に着地
  landingSec: number;
}
export default function RhythmicalSlime(props: Props) {
  const { playing, getCurrentTimeSec, bpmChanges } = props;
  const step = useRef<Step>(stepZero());
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
          const preparingSec = getTimeSec(
            bpmChanges,
            stepSub(ss.stepAligned, {
              fourth: 0,
              numerator: 3,
              denominator: (slimeSize / 4) * 4,
            })
          );
          if (preparingSec > now) {
            timer = setTimeout(nextStep, (preparingSec - now) * 1000);
            return;
          }
          const jumpBeginSec = getTimeSec(
            bpmChanges,
            stepSub(ss.stepAligned, {
              fourth: 0,
              numerator: 1,
              denominator: (slimeSize / 4) * 4,
            })
          );
          const jumpEndSec = getTimeSec(
            bpmChanges,
            stepAdd(ss.stepAligned, {
              fourth: 0,
              numerator: 1,
              denominator: (slimeSize / 4) * 4,
            })
          );
          const landingSec = getTimeSec(
            bpmChanges,
            stepAdd(ss.stepAligned, {
              fourth: 0,
              numerator: 3,
              denominator: (slimeSize / 4) * 4,
            })
          );
          setSlimeStates((states) => {
            const newStates = [...states];
            while (slimeIndex >= newStates.length) {
              newStates.push(undefined);
            }
            newStates[slimeIndex] = {
              jumpBeginSec,
              jumpEndSec,
              landingSec,
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
  // 0: preparing, 1: jumping, 2: end
  const [action, setAction] = useState<number>(0);
  const durationSec = useRef<number>(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const update = () => {
      timer = null;
      const now = props.getCurrentTimeSec();
      if (now === undefined || props.state === undefined) {
        setAction(2);
      } else if (now < props.state.jumpBeginSec) {
        setAction(0);
        durationSec.current = props.state.jumpBeginSec - now;
        timer = setTimeout(update, (props.state.jumpBeginSec - now) * 1000);
      } else if (now < props.state.jumpEndSec) {
        setAction(1);
        durationSec.current = props.state.jumpEndSec - now;
        timer = setTimeout(update, (props.state.jumpEndSec - now) * 1000);
      } else {
        setAction(2);
        durationSec.current = props.state.landingSec - now;
      }
    };
    update();
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [props]);
  return (
    <span
      className="relative "
      style={{
        width:
          (props.size === 4 ? 1 : props.size === 8 ? 0.75 : 0.5) *
          54 *
          props.playUIScale,
        marginLeft: 6 * props.playUIScale,
      }}
    >
      <span
        className="absolute inset-x-0 "
        style={{
          animationName: props.exists
            ? "rhythmical-slime-appearing"
            : "rhythmical-slime-disappearing",
          animationIterationCount: 1,
          animationDuration: "0.25s",
          animationTimingFunction: "linear",
          animationFillMode: "forwards",
        }}
      >
        <img
          src={process.env.ASSET_PREFIX + "/assets/slime.svg"}
          className={
            "absolute bottom-0 inset-x-0 " +
            "transition-transform origin-bottom " +
            (action === 1
              ? "ease-out -translate-y-1/2 scale-y-110 "
              : action === 0
              ? "ease-out translate-y-0 scale-y-75 "
              : "ease-in translate-y-0 scale-y-100 ")
          }
          style={{
            transitionDuration: durationSec.current + "s",
          }}
        />
      </span>
    </span>
  );
}
