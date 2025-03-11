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
  // 対象の時刻の3/4ステップ前からしゃがむ
  // 対象の時刻の1/4ステップ前からジャンプしはじめ、
  // 対象の時刻の1/4ステップ後に最高点、
  // 3/4ステップ後に着地
  preparingSec: number;
  landingSec: number;
  animDuration: number;
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
          const jumpBeginSec = getTimeSec(
            bpmChanges,
            stepSub(ss.stepAligned, {
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
          const animDuration = (landingSec - jumpBeginSec) / 0.5;
          const preparingSec = jumpBeginSec - animDuration * 0.2;
          if (preparingSec > now) {
            timer = setTimeout(nextStep, (preparingSec - now) * 1000);
            return;
          }
          setSlimeStates((states) => {
            const newStates = [...states];
            while (slimeIndex >= newStates.length) {
              newStates.push(undefined);
            }
            newStates[slimeIndex] = {
              preparingSec,
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
  const [action, setAction] = useState<boolean>(false);
  const durationSec = useRef<number>(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const update = () => {
      timer = null;
      const now = props.getCurrentTimeSec();
      if (now === undefined || props.state === undefined) {
        setAction(false);
      } else if (
        now >= props.state.preparingSec &&
        now < props.state.landingSec
      ) {
        durationSec.current = props.state.animDuration;
        timer = setTimeout(update, props.state.animDuration * 1000);
        setAction(true);
      } else {
        durationSec.current = props.state.animDuration;
        setAction(false);
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
        marginLeft: 0 * props.playUIScale,
      }}
    >
      <SlimeSVG
        className="absolute inset-x-0 bottom-0 "
        appearingAnim
        hidden={!props.exists}
        duration={durationSec.current}
        stopJumping={!action}
        noLoop
      />
    </span>
  );
}
