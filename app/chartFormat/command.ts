import { Step, stepToFloat, stepZero, validateStep } from "./step";

/**
 * 音符コマンド
 * step: 判定時刻(step数)
 * hitX: 判定時のX
 * (hitY = 0)
 * hitVX: 判定時のX速度
 * hitVY: 判定時のY速度
 * (accelX = 0)
 * accelY: Y加速度
 * timeScale: { 時刻(判定時刻 - step数), VX,VY,accelYの倍率 } のリスト
 */
export interface NoteCommand {
  step: Step;
  big: boolean;
  hitX: number;
  hitVX: number;
  hitVY: number;
  accelY: number;
}
export function validateNoteCommand(n: NoteCommand) {
  validateStep(n.step);
  if (typeof n.big !== "boolean") throw "note.big is invalid";
  if (typeof n.hitX !== "number") throw "note.hitX is invalid";
  if (typeof n.hitVX !== "number") throw "note.hitVX is invalid";
  if (typeof n.hitVY !== "number") throw "note.hitVY is invalid";
  if (typeof n.accelY !== "number") throw "note.accelY is invalid";
}
export function defaultNoteCommand(
  bpmChanges: BPMChange[],
  currentStep: Step = stepZero(),
): NoteCommand {
  return {
    step: currentStep,
    big: false,
    hitX: -3,
    hitVX: +1,
    hitVY: +3,
    accelY: +1,
  };
}

/**
 *       timeSec +=
        (60 / bpmChanges[bi].bpm) *
        (bpmChanges[bi + 1].step - bpmChanges[bi].step);
 */
export interface BPMChange {
  step: Step;
  timeSec: number;
  bpm: number;
}
export function validateBpmChange(b: BPMChange) {
  validateStep(b.step);
  if (typeof b.timeSec !== "number") throw "BpmChange.timeSec is invalid";
  if (typeof b.bpm !== "number") throw "BpmChange.bpm is invalid";
}
/**
 * stepが正しいとしてtimeSecを再計算
 */
export function updateBpmTimeSec(bpmChanges: BPMChange[]) {
  let timeSum = 0;
  for (let bi = 0; bi < bpmChanges.length; bi++) {
    bpmChanges[bi].timeSec = timeSum;
    console.log(bpmChanges[bi]);
    if (bi + 1 < bpmChanges.length) {
      timeSum +=
        (60 / bpmChanges[bi].bpm) *
        (stepToFloat(bpmChanges[bi + 1].step) -
          stepToFloat(bpmChanges[bi].step));
    }
  }
}
