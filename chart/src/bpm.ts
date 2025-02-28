import { BPMChange1 } from "./legacy/chart1.js";
import { BPMChangeWithLua3 } from "./legacy/chart3.js";
import { stepCmp, stepToFloat, validateStep } from "./step.js";

/**
 * timeSec +=
 *  (60 / bpmChanges[bi].bpm) *
 *  (bpmChanges[bi + 1].step - bpmChanges[bi].step);
 */
export type BPMChange = BPMChange1;
export type BPMChangeWithLua = BPMChangeWithLua3;

export function validateBpmChange(b: BPMChangeWithLua) {
  validateStep(b.step);
  if (typeof b.timeSec !== "number") throw "BpmChange.timeSec is invalid";
  if (typeof b.bpm !== "number") throw "BpmChange.bpm is invalid";
  if (typeof b.luaLine !== "number" && b.luaLine !== null)
    throw "note.luaLine is invalid";
}

/**
 * stepが正しいとしてtimeSecを再計算
 */
export function updateBpmTimeSec(
  bpmChanges: BPMChange[],
  scaleChanges: BPMChange[]
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
