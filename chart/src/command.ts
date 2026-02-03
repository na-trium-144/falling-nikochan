import { NoteCommand9, Rest9 } from "./legacy/chart9.js";
import { Step, stepZero } from "./step.js";

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
export type NoteCommand = Omit<NoteCommand9, "luaLine">;
export type NoteCommandWithLua = NoteCommand9;

export function defaultNoteCommand(
  currentStep: Step = stepZero()
): NoteCommandWithLua {
  return {
    step: currentStep,
    big: false,
    hitX: -3,
    hitVX: +1,
    hitVY: +3,
    fall: true,
    luaLine: null,
  };
}

export type RestStep = Rest9;

export function defaultCopyBuffer() {
  return ([defaultNoteCommand()] as (NoteCommandWithLua | null)[]).concat(
    Array.from(new Array(9)).map(() => null)
  );
}
