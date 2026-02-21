import { BPMChange1 } from "./legacy/chart1.js";
import {
  BPMChange15,
  BPMChangeWithLua15,
  SpeedChange15,
  SpeedChangeWithLua15,
} from "./legacy/chart15.js";
import { stepCmp, stepToFloat } from "./step.js";

/**
 * timeSec +=
 *  (60 / bpmChanges[bi].bpm) *
 *  (bpmChanges[bi + 1].step - bpmChanges[bi].step);
 */
export type BPMChange = BPMChange15;
export type BPMChangeWithLua = BPMChangeWithLua15;
export type BPMChangeWithTimeSec = BPMChangeWithLua & { timeSec: number };

export type SpeedChange = SpeedChange15;
export type SpeedChangeWithLua = SpeedChangeWithLua15;
export type SpeedChangeWithTimeSec = SpeedChangeWithLua & { timeSec: number };
/**
 * stepが正しいとしてtimeSecを再計算
 */
export function updateBpmTimeSec<
  BPMChanges extends Array<Omit<BPMChange1, "timeSec">>,
  SpeedChanges extends Array<Omit<BPMChange1, "timeSec">>,
>(
  bpmChanges: BPMChanges,
  scaleChanges: SpeedChanges
): {
  bpm: Array<BPMChanges[number] & { timeSec: number }>;
  speed: Array<SpeedChanges[number] & { timeSec: number }>;
} {
  let timeSum = 0;
  let si = 0;
  const bpm = bpmChanges.map((bpmChange) => ({ ...bpmChange, timeSec: 0 }));
  const speed = scaleChanges.map((scaleChange) => ({
    ...scaleChange,
    timeSec: 0,
  }));
  for (let bi = 0; bi < bpm.length; bi++) {
    bpm[bi].timeSec = timeSum;
    while (
      si < speed.length &&
      (bi + 1 >= bpm.length || stepCmp(speed[si].step, bpm[bi + 1].step) < 0)
    ) {
      speed[si].timeSec =
        timeSum +
        (60 / bpm[bi].bpm) *
          (stepToFloat(speed[si].step) - stepToFloat(bpm[bi].step));
      si++;
    }
    if (bi + 1 < bpm.length) {
      timeSum +=
        (60 / bpm[bi].bpm) *
        (stepToFloat(bpm[bi + 1].step) - stepToFloat(bpm[bi].step));
    }
  }
  return { bpm, speed };
}
