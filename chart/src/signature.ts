import { Signature15, SignatureWithLua15 } from "./legacy/chart15.js";
import { Signature5 } from "./legacy/chart5.js";
import {
  Step,
  stepAdd,
  stepCmp,
  stepSimplify,
  stepSub,
  stepZero,
} from "./step.js";
import * as v from "valibot";

export const SignatureBarSchema = () =>
  v.pipe(
    v.array(v.array(v.picklist([4, 8, 16] as const))),
    v.description(
      "The time signature pattern. " +
        "For instance, [[4, 4, 4, 4]] is 4/4 beat, [[4, 4, 4, 8]] is 7/8 beat, " +
        "[[4, 4, 4, 4], [4, 4, 4]] is 4/4 + 3/4 beat."
    )
  );

export type Signature = Signature15;
export type SignatureWithLua = SignatureWithLua15;
export type SignatureWithBarNum = SignatureWithLua & { barNum: number };

export function getBarLength(s: Signature | Signature5): Step[] {
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
export function toStepArray(s: Signature | Signature5): Step[][] {
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
export function updateBarNum<
  Signatures extends Array<Omit<Signature5, "barNum">>,
>(signatures: Signatures): Array<Signatures[number] & { barNum: number }> {
  let barNum = 0;
  const signaturesWithBarNum = signatures.map((s) => ({ ...s, barNum: 0 }));
  for (let si = 1; si < signaturesWithBarNum.length; si++) {
    let prevBarBegin = stepSub(
      signaturesWithBarNum[si - 1].step,
      signaturesWithBarNum[si - 1].offset
    );
    const prevBarLength = getBarLength(signaturesWithBarNum[si - 1]);
    let bi = 0;
    while (stepCmp(prevBarBegin, signaturesWithBarNum[si].step) < 0) {
      barNum += 1;
      prevBarBegin = stepAdd(
        prevBarBegin,
        prevBarLength[bi % prevBarLength.length]
      );
      bi += 1;
    }
    signaturesWithBarNum[si].barNum = barNum;
  }
  return signaturesWithBarNum;
}
