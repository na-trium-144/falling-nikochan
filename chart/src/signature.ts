import { Signature5, SignatureWithLua5 } from "./legacy/chart5.js";
import {
  Step,
  stepAdd,
  stepCmp,
  stepSimplify,
  stepSub,
  stepZero,
  validateStep,
} from "./step.js";

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
export type Signature = Signature5;
export type SignatureWithLua = SignatureWithLua5;

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
