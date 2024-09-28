import { Step } from "@/chartFormat/step";

export function timeStr(timeSec: number): string {
  if (timeSec < 0) {
    return "-" + timeStr(-timeSec);
  } else {
    return (
      Math.floor(timeSec / 60).toString() +
      ":" +
      (Math.floor(timeSec) % 60).toString().padStart(2, "0") +
      "." +
      (Math.floor(timeSec * 100) % 100).toString().padStart(2, "0")
    );
  }
}
export function timeSecStr(timeSec: number): string {
  if (timeSec < 0) {
    return "-" + timeSecStr(-timeSec);
  } else {
    return ":" + (Math.floor(timeSec) % 60).toString().padStart(2, "0");
  }
}

// todo: 拍子を考慮
export function stepMeasure(s: Step): string {
  return (Math.floor(s.fourth / 4) + 1).toString();
}
export function stepFourth(s: Step): string {
  return ((s.fourth % 4) + 1).toString();
}
export function stepNumerator(s: Step): string {
  return s.numerator.toString();
}
export function stepDenominator(s: Step): string {
  return (s.denominator * 4).toString();
}
export function stepStr(s: Step): string {
  if (s.numerator === 0) {
    return `${stepMeasure(s)};${stepFourth(s)}`;
  } else {
    return (
      `${stepMeasure(s)};${stepFourth(s)}` +
      `+${stepNumerator(s)}/${stepDenominator(s)}`
    );
  }
}
export function stepNStr(s: Step): string {
  if (s.numerator === 0) {
    return `${stepMeasure(s)};${stepFourth(s)}`;
  } else {
    return "";
  }
}
