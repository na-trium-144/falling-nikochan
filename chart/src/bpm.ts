import { BPMChange1 } from "./legacy/chart1.js";
import { SpeedChange13, SpeedChangeWithLua13 } from "./legacy/chart13.js";
import { BPMChange9 } from "./legacy/chart9.js";
import { stepCmp, stepToFloat } from "./step.js";

/**
 * timeSec +=
 *  (60 / bpmChanges[bi].bpm) *
 *  (bpmChanges[bi + 1].step - bpmChanges[bi].step);
 */
export type BPMChange = Omit<BPMChange9, "luaLine">;
export type BPMChangeWithLua = BPMChange9;

export type SpeedChange = SpeedChange13;
export type SpeedChangeWithLua = SpeedChangeWithLua13;
/**
 * stepが正しいとしてtimeSecを再計算
 */
export function updateBpmTimeSec(
  bpmChanges: BPMChange[] | BPMChange1[],
  scaleChanges: BPMChange[] | BPMChange1[]
) {
  let timeSum = 0;
  let si = 0;
  for (let bi = 0; bi < bpmChanges.length; bi++) {
    bpmChanges[bi].timeSec = timeSum;
    while (
      si < scaleChanges.length &&
      (bi + 1 >= bpmChanges.length ||
        stepCmp(scaleChanges[si].step, bpmChanges[bi + 1].step) < 0)
    ) {
      scaleChanges[si].timeSec =
        timeSum +
        (60 / bpmChanges[bi].bpm) *
          (stepToFloat(scaleChanges[si].step) -
            stepToFloat(bpmChanges[bi].step));
      si++;
    }
    if (bi + 1 < bpmChanges.length) {
      timeSum +=
        (60 / bpmChanges[bi].bpm) *
        (stepToFloat(bpmChanges[bi + 1].step) -
          stepToFloat(bpmChanges[bi].step));
    }
  }
}
