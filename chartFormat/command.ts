import {
  Step,
  stepAdd,
  stepCmp,
  stepSimplify,
  stepSub,
  stepToFloat,
  stepZero,
  validateStep,
} from "./step.js";

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
}
export interface NoteCommandWithLua extends NoteCommand {
  luaLine: number | null;
}
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

export interface RestStep {
  begin: Step;
  duration: Step;
  luaLine: number | null;
}
export function validateRestStep(n: RestStep) {
  validateStep(n.begin);
  validateStep(n.duration);
  if (typeof n.luaLine !== "number" && n.luaLine !== null)
    throw "note.luaLine is invalid";
}

/**
 * 例: 15/8 = 4/4 + 7/8 の場合
 * (4分, 4分, 4分, 4分) + (4分, 4分, 4分, 8分)
 * → [[4, 4, 4, 4], [4, 4, 4, 8]]
 * 4分、8分、16分の和で表せる拍子のみしか対応しない。
 *
 * step: 変化位置
 * offset: n拍目からカウントを始める
 *  (step - offset がこのSignatureの1拍目になる)
 *
 * barNum: このSignatureが始まる時点の小節番号
 *
 */
export interface Signature {
  step: Step;
  offset: Step;
  barNum: number;
  bars: (4 | 8 | 16)[][];
}
export interface SignatureWithLua extends Signature {
  luaLine: number | null;
}
export function validateSignature(s: SignatureWithLua) {
  validateStep(s.step);
  validateStep(s.offset);
  if (!Array.isArray(s.bars)) throw "signature.bars is invalid";
  s.bars.forEach((b) => {
    if (!Array.isArray(b)) throw "signature.bars is invalid";
    b.forEach((bs) => {
      if (bs !== 4 && bs !== 8 && bs !== 16) throw "signature.bars is invalid";
    });
  });
  if (typeof s.luaLine !== "number" && s.luaLine !== null)
    throw "signature.luaLine is invalid";
}
export function getBarLength(s: Signature): Step[] {
  const barLength = toStepArray(s).map((b) =>
    b.reduce((len, bs) => stepAdd(len, bs), stepZero())
  );
  barLength.forEach((len) => {
    if (stepCmp(len, stepZero()) <= 0) {
      throw new Error("Invalid signature (empty bar): " + JSON.stringify(s));
    }
  });
  return barLength;
}
export function toStepArray(s: Signature): Step[][] {
  return s.bars.map((b) =>
    b.map((bs) =>
      stepSimplify({ fourth: 0, numerator: 1, denominator: bs / 4 })
    )
  );
}
export function barFromLength(len: Step): (4 | 8 | 16)[] {
  const newBar: (4 | 8 | 16)[] = [];
  for (const d of [4, 8, 16]) {
    while (
      stepCmp(len, {
        fourth: 0,
        numerator: 1,
        denominator: d / 4,
      }) >= 0
    ) {
      len = stepSub(len, {
        fourth: 0,
        numerator: 1,
        denominator: d / 4,
      });
      newBar.push(d as 4 | 8 | 16);
    }
  }
  return newBar;
}
export function updateBarNum(signatures: Signature[]) {
  let barNum = 0;
  signatures[0].barNum = 0;
  for (let si = 1; si < signatures.length; si++) {
    let prevBarBegin = stepSub(
      signatures[si - 1].step,
      signatures[si - 1].offset
    );
    const prevBarLength = getBarLength(signatures[si - 1]);
    let bi = 0;
    while (stepCmp(prevBarBegin, signatures[si].step) < 0) {
      barNum += 1;
      prevBarBegin = stepAdd(
        prevBarBegin,
        prevBarLength[bi % prevBarLength.length]
      );
      bi += 1;
    }
    signatures[si].barNum = barNum;
  }
}

/**
 * timeSec +=
 *  (60 / bpmChanges[bi].bpm) *
 *  (bpmChanges[bi + 1].step - bpmChanges[bi].step);
 */
export interface BPMChange {
  step: Step;
  timeSec: number;
  bpm: number;
}
export interface BPMChangeWithLua extends BPMChange {
  luaLine: number | null;
}
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
