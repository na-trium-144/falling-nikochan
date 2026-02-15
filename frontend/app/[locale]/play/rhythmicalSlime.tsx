"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx/lite";
import {
  BPMChange,
  BPMChange1,
  getStep,
  Signature5,
  SignatureState,
  stepCmp,
  stepZero,
} from "@falling-nikochan/chart";
import { Signature } from "@falling-nikochan/chart";
import { getSignatureState, getTimeSec } from "@falling-nikochan/chart";
import { Step, stepAdd } from "@falling-nikochan/chart";
import { useDisplayMode } from "@/scale.js";
import { SlimeSVG } from "@/common/slime";

interface Props {
  className?: string;
  style?: object;
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  bpmChanges?: BPMChange[] | BPMChange1[];
  signature: Signature[] | Signature5[];
  playbackRate: number;
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
  const { className, style, playing, getCurrentTimeSec, bpmChanges, signature, playbackRate } = props;
  const step = useRef<Step | null>(null);
  const prevSS = useRef<SignatureState | null>(null);
  const lastPreparingSec = useRef<number | null>(null);
  const [maxSlimeNum, setMaxSlimeNum] = useState<number>(0);
  const [currentBar, setCurrentBar] = useState<(4 | 8 | 16)[]>([]);
  const [slimeStates, setSlimeStates] = useState<SlimeState[][]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (playing) {
      const nextStep = () => {
        const now = getCurrentTimeSec();
        while (now !== undefined && playing && bpmChanges) {
          if (
            lastPreparingSec.current != null &&
            lastPreparingSec.current > now
          ) {
            timer = setTimeout(
              nextStep,
              ((lastPreparingSec.current - now) * 1000) / playbackRate
            );
            return;
          }
          if (!step.current) {
            // play開始直後にstepを初期化 (zeroとは限らない)
            step.current = getStep(bpmChanges, now, 32);
            if (stepCmp(step.current, stepZero()) < 0) {
              step.current = stepZero();
            } else {
              const ss = getSignatureState(signature, step.current);
              step.current = ss.stepAligned;
              const slimeIndex = ss.count.fourth;
              const slimeSize = ss.bar[slimeIndex];
              const slimeSizeStep = {
                fourth: 0,
                numerator: 1,
                denominator: slimeSize / 4,
              };
              step.current = stepAdd(ss.stepAligned, slimeSizeStep);
            }
          }
          const ss = getSignatureState(signature, step.current);
          step.current = ss.stepAligned;
          const slimeIndex = ss.count.fourth;
          const slimeSize = ss.bar[slimeIndex];
          const slimeSizeStep = {
            fourth: 0,
            numerator: 1,
            denominator: slimeSize / 4,
          };
          if (
            prevSS.current === null ||
            prevSS.current.bar.length !== ss.bar.length ||
            !prevSS.current.bar.every((v, i) => v === ss.bar[i])
          ) {
            const barChangeSec = getTimeSec(bpmChanges, ss.stepAligned);
            const barChange = () => {
              setMaxSlimeNum((num) => Math.max(num, ss.bar.length));
              setCurrentBar(ss.bar);
            };
            if (barChangeSec > now) {
              setTimeout(
                barChange,
                ((barChangeSec - now) * 1000) / playbackRate
              );
            } else {
              barChange();
            }
          }
          prevSS.current = ss;
          // const jumpBeginSec = getTimeSec(
          //   bpmChanges,
          //   stepSub(ss.stepAligned, {
          //     fourth: 0,
          //     numerator: 1,
          //     denominator: (slimeSize / 4) * 6,
          //   })
          // );
          const jumpMidSec = getTimeSec(
            bpmChanges,
            stepAdd(ss.stepAligned, {
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
          const animDuration = (landingSec - jumpMidSec) * 3;
          const jumpBeginSec = jumpMidSec - animDuration / 3;
          // const jumpMidSec = (jumpBeginSec + landingSec) / 2;
          const preparingSec = jumpBeginSec - animDuration / 3;
          lastPreparingSec.current = preparingSec;
          setSlimeStates((states) => {
            const newStates = [...states];
            while (slimeIndex >= newStates.length) {
              newStates.push([]);
            }
            for (let i = 0; i < newStates.length; i++) {
              // 古いstateを消す
              newStates[i] = newStates[i].filter((s) => s.landingSec > now);
            }
            newStates[slimeIndex].push({
              preparingSec,
              jumpBeginSec,
              jumpMidSec,
              landingSec,
              animDuration,
            });
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
      step.current = null;
      prevSS.current = null;
      lastPreparingSec.current = null;
      setSlimeStates([]);
      setMaxSlimeNum((num) =>
        Math.max(num, signature[0]?.bars[0].length)
      );
      setCurrentBar(signature[0]?.bars[0] || []);
    }
  }, [bpmChanges, playing, getCurrentTimeSec, signature, playbackRate]);

  const { playUIScale, rem } = useDisplayMode();

  return (
    <div
      className={clsx(className, "flex flex-row-reverse")}
      style={style}
    >
      {Array.from(new Array(maxSlimeNum)).map((_, i) => (
        <Slime
          key={i}
          exists={i < currentBar.length}
          size={i < currentBar.length ? currentBar[i] || 4 : null}
          state={slimeStates.at(i)?.at(0)}
          getCurrentTimeSec={getCurrentTimeSec}
          playUIScale={playUIScale}
          rem={rem}
          playbackRate={playbackRate}
        />
      ))}
    </div>
  );
}

interface PropsS {
  getCurrentTimeSec: () => number | undefined;
  size: 4 | 8 | 16 | null;
  exists: boolean;
  state?: SlimeState;
  playUIScale: number;
  rem: number;
  playbackRate: number;
}
function Slime(props: PropsS) {
  const { size: propsSize, exists, state, getCurrentTimeSec, playUIScale, rem, playbackRate } = props;
  const prevSize = useRef<4 | 8 | 16 | null>(null);
  let size: 4 | 8 | 16;
  if (propsSize === null) {
    size = prevSize.current || 4;
  } else {
    size = propsSize;
    prevSize.current = size;
  }
  const [firstFrame, setFirstFrame] = useState<boolean>(true);
  useEffect(() => {
    requestAnimationFrame(() => setFirstFrame(false));
  }, []);
  const prevJumpMid = useRef<number | null>(null);
  const [jumpingMidDate, setJumpingMidDate] =
    useState<DOMHighResTimeStamp | null>(null);
  const durationSec = useRef<number>(0);
  useEffect(() => {
    const now = getCurrentTimeSec();
    if (now === undefined || state === undefined) {
      setJumpingMidDate(null);
      prevJumpMid.current = null;
    } else if (prevJumpMid.current !== state.jumpMidSec) {
      prevJumpMid.current = state.jumpMidSec;
      durationSec.current = state.animDuration / playbackRate;
      setJumpingMidDate(
        performance.now() + ((state.jumpMidSec - now) * 1000) / playbackRate
      );
    }
  }, [getCurrentTimeSec, state, playbackRate]);
  return (
    <span
      className="relative transition-all ease-in-out duration-150 "
      style={{
        width:
          (size === 4 ? 1 : size === 8 ? 0.75 : 0.5) *
          3.5 *
          rem *
          playUIScale,
        marginLeft: 0 * playUIScale,
      }}
    >
      <SlimeSVG
        className="absolute inset-x-0 bottom-0 "
        appearingAnim
        hidden={firstFrame || !exists}
        jumpingMid={jumpingMidDate}
        duration={durationSec.current}
        noLoop
      />
    </span>
  );
}
