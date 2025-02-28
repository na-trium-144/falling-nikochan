import { RestStep3 } from "./legacy/chart3.js";
import { NoteCommand7, NoteCommandWithLua7 } from "./legacy/chart7.js";
import { Step, stepZero, validateStep } from "./step.js";

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
 * fall: 音符出現位置を画面上にする(true) or 下にする(false)
 */
export type NoteCommand = NoteCommand7;
export type NoteCommandWithLua = NoteCommandWithLua7;

export function validateNoteCommand(n: NoteCommandWithLua) {
  validateStep(n.step);
  if (typeof n.big !== "boolean") throw "note.big is invalid";
  if (typeof n.hitX !== "number") throw "note.hitX is invalid";
  if (typeof n.hitVX !== "number") throw "note.hitVX is invalid";
  if (typeof n.hitVY !== "number") throw "note.hitVY is invalid";
  if (typeof n.luaLine !== "number" && n.luaLine !== null)
    throw "note.luaLine is invalid";
  if (typeof n.fall !== "boolean") throw "note.fall is invalid";
}
export function defaultNoteCommand(
  currentStep: Step = stepZero()
): NoteCommand {
  return {
    step: currentStep,
    big: false,
    hitX: -3,
    hitVX: +1,
    hitVY: +3,
    fall: true,
    // luaLine
  };
}

export type RestStep = RestStep3;

export function validateRestStep(n: RestStep) {
  validateStep(n.begin);
  validateStep(n.duration);
  if (typeof n.luaLine !== "number" && n.luaLine !== null)
    throw "note.luaLine is invalid";
}
