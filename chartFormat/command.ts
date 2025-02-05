import {
  NoteCommand3,
  NoteCommandWithLua3,
  RestStep3,
} from "./legacy/chart3.js";
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
 */
export type NoteCommand = NoteCommand3;
export type NoteCommandWithLua = NoteCommandWithLua3;

export function validateNoteCommand(n: NoteCommandWithLua) {
  validateStep(n.step);
  if (typeof n.big !== "boolean") throw "note.big is invalid";
  if (typeof n.hitX !== "number") throw "note.hitX is invalid";
  if (typeof n.hitVX !== "number") throw "note.hitVX is invalid";
  if (typeof n.hitVY !== "number") throw "note.hitVY is invalid";
  if (typeof n.luaLine !== "number" && n.luaLine !== null)
    throw "note.luaLine is invalid";
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
