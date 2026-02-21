import * as v from "valibot";

export const StepSchema = () =>
  v.pipe(
    v.object({
      fourth: v.pipe(v.number(), v.integer(), v.minValue(0)),
      numerator: v.pipe(v.number(), v.integer(), v.minValue(0)),
      denominator: v.pipe(v.number(), v.integer(), v.minValue(1)),
    }),
    /* v.forward(
    v.check(
      ({ numerator, denominator }) => numerator < denominator,
      "numerator < denominator"
    ),
    ["numerator"]
    ) */
    v.description(
      "Represents the time duration of (fourth + numerator / denominator) quarter notes. " +
        "All parameters are positive integers greater than or equal to 0, with numerator < denominator. " +
        "However, they are not necessarily indecomposable fractions.\n" +
        "Always counts the number of quarter notes, regardless of the signature.\n" +
        "Confusingly, the increment used to move the cursor on the edit screen " +
        "(1 / snapDivider) is also called a step, but it's a different thing. "
    )
  );
export type Step = v.InferOutput<ReturnType<typeof StepSchema>>;
export function stepZero(): Step {
  return { fourth: 0, numerator: 0, denominator: 1 };
}
export function stepToFloat(s: Step) {
  return s.fourth + s.numerator / s.denominator;
}
/**
 * 1: s1 > s2
 * 0: s1 = s2
 * -1: s1 < s2
 */
export function stepCmp(s1: Step, s2: Step) {
  if (
    s1.fourth === s2.fourth &&
    s1.numerator * s2.denominator === s1.denominator * s2.numerator
  ) {
    return 0;
  } else {
    return Math.sign(stepToFloat(s1) - stepToFloat(s2));
  }
}
/**
 * s1 - s2
 */
export function stepSub(s1: Step, s2: Step) {
  return stepAdd(s1, {
    fourth: -s2.fourth,
    numerator: -s2.numerator,
    denominator: s2.denominator,
  });
}
/**
 * s1 + s2
 */
export function stepAdd(s1: Step, s2: Step) {
  const sa: Step = {
    fourth: s1.fourth + s2.fourth,
    numerator: s1.numerator * s2.denominator + s2.numerator * s1.denominator,
    denominator: s1.denominator * s2.denominator,
  };
  return stepSimplify(sa);
}
export function stepSimplify(s: Step) {
  s.fourth += Math.floor(s.numerator / s.denominator);
  s.numerator -= Math.floor(s.numerator / s.denominator) * s.denominator;
  for (let i = 2; i <= s.numerator && i <= s.denominator; i++) {
    while (s.numerator % i == 0 && s.denominator % i == 0) {
      s.numerator /= i;
      s.denominator /= i;
    }
  }
  if (s.numerator === 0) {
    s.denominator = 1;
  }
  // キーの順序を保つために新しいオブジェクトを返す
  return {
    fourth: s.fourth,
    numerator: s.numerator,
    denominator: s.denominator,
  };
}
export function stepImproper(s: Step) {
  return s.fourth * s.denominator + s.numerator;
}
