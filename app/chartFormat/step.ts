/**
 * 時刻(step数)の数え方
 * 4分音符の個数 = fourth + numerator / denominator
 * パラメーターはいずれも自然数で、 numerator < denominator
 * ただし既約分数であるとは限らない
 */
export interface Step {
  fourth: number;
  numerator: number;
  denominator: number;
}
export function validateStep(s: Step) {
  if (typeof s.fourth !== "number") throw "step.fourth is invalid";
  if (typeof s.numerator !== "number") throw "step.numerator is invalid";
  if (typeof s.denominator !== "number") throw "step.denominator is invalid";
}
export function stepZero(): Step {
  return { fourth: 0, numerator: 0, denominator: 4 };
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
    s.denominator = 4;
  }
  return s;
}
