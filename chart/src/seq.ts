import { getBarLength, Signature, toStepArray } from "./signature.js";
import { BPMChange } from "./bpm.js";
import {
  Step,
  stepAdd,
  stepCmp,
  stepSub,
  stepToFloat,
  stepZero,
} from "./step.js";
import { displayNote7, DisplayNote7, Note7 } from "./legacy/seq7.js";
import { loadChart8 } from "./legacy/seq8.js";
import { BPMChange1 } from "./legacy/chart1.js";
import { Signature5 } from "./legacy/chart5.js";

export type Note = Note7;
export type DisplayNote = DisplayNote7;
export const displayNote = displayNote7;
export const loadChart = loadChart8;

/**
 * 判定線の位置
 */
export const targetY = 0.2;
/**
 * big音符の大きさ
 */
export function bigScale(big: boolean) {
  return big ? 1.5 : 1;
}
/**
 * 画面上の位置
 * x: 0(画面左端)〜1(画面右端)
 * y: 0(判定ライン)〜1(画面上端)
 */
export interface Pos {
  x: number;
  y: number;
}

function defaultBpmChange(): BPMChange {
  return { timeSec: 0, bpm: 120, step: stepZero(), luaLine: null };
}
/**
 * bpmとstep数→時刻(秒数)
 */
export function getTimeSec(
  bpmChanges: BPMChange[] | BPMChange1[],
  step: Step,
): number {
  const targetBpmChange =
    bpmChanges[findBpmIndexFromStep(bpmChanges, step)] || defaultBpmChange();
  return (
    targetBpmChange.timeSec +
    (60 / targetBpmChange.bpm) *
      (stepToFloat(step) - stepToFloat(targetBpmChange.step))
  );
}
/**
 * bpmと時刻(秒数)→step
 */
export function getStep(
  bpmChanges: BPMChange[] | BPMChange1[],
  timeSec: number,
  denominator: number,
): Step {
  const targetBpmChange =
    bpmChanges[findBpmIndexFromSec(bpmChanges, timeSec)] || defaultBpmChange();
  const stepFloat =
    stepToFloat(targetBpmChange.step) +
    (timeSec - targetBpmChange.timeSec) / (60 / targetBpmChange.bpm);
  const num = Math.round(stepFloat * denominator);
  return {
    fourth: Math.floor(num / denominator),
    numerator: num % denominator,
    denominator,
  };
}
/**
 * 時刻(step)→小節数+小節内の拍数
 */
export function getSignatureState(
  signature: Signature[],
  step: Step,
): SignatureState {
  const targetSignature = signature[findBpmIndexFromStep(signature, step)];
  let barBegin = stepSub(targetSignature.step, targetSignature.offset);
  const barSteps = toStepArray(targetSignature);
  const barLength = getBarLength(targetSignature);
  let barNum = targetSignature.barNum;
  let bi = 0;
  while (true) {
    const barEnd = stepAdd(barBegin, barLength[bi % barLength.length]);
    if (stepCmp(barEnd, step) > 0) {
      let barStepBegin = barBegin;
      for (let si = 0; si < barSteps[bi % barLength.length].length; si++) {
        const barStepEnd = stepAdd(
          barStepBegin,
          barSteps[bi % barLength.length][si],
        );
        if (stepCmp(barStepEnd, step) > 0) {
          return {
            barNum,
            bar: targetSignature.bars[bi % barLength.length],
            stepAligned: barStepBegin,
            offset: stepSub(step, barBegin),
            count: stepAdd(stepSub(step, barStepBegin), {
              fourth: si,
              numerator: 0,
              denominator: 1,
            }),
          };
        }
        barStepBegin = barStepEnd;
      }
      throw new Error("should not reach here");
    }
    barNum += 1;
    barBegin = barEnd;
    bi += 1;
  }
}

export interface SignatureState {
  barNum: number;
  bar: (4 | 8 | 16)[];
  stepAligned: Step; // このカウントの開始にあわせた時刻
  offset: Step; // barの最初からの時刻
  count: Step; // これは時刻表現ではなく表示用、count.fourthはbar内のカウントに対応するので時間が飛ぶこともある
}

/**
 * 時刻(秒数)→bpm
 */
export function findBpmIndexFromSec(
  bpmChanges: BPMChange[] | BPMChange1[],
  timeSec: number,
): number {
  if (bpmChanges.length === 0) {
    return 0;
  }
  const targetBpmIndex = bpmChanges.findIndex((ch) => timeSec < ch.timeSec) - 1;
  if (targetBpmIndex === -2) {
    return bpmChanges.length - 1;
  }
  if (targetBpmIndex === -1) {
    return 0;
  }
  return targetBpmIndex;
}
/**
 * 時刻(秒数)→bpm
 */
export function findBpmIndexFromStep(
  bpmChanges: BPMChange[] | BPMChange1[] | Signature[] | Signature5[],
  step: Step,
): number {
  if (bpmChanges.length === 0) {
    return 0;
  }
  const targetBpmIndex =
    bpmChanges.findIndex((ch) => stepCmp(step, ch.step) < 0) - 1;
  if (targetBpmIndex === -2) {
    return bpmChanges.length - 1;
  }
  if (targetBpmIndex === -1) {
    return 0;
  }
  return targetBpmIndex;
}
