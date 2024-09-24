import { Step } from "@/chartFormat/command";

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

export function stepStr(s: Step): string {
  if (s.numerator === 0) {
    return s.fourth.toString();
  } else {
    return `${s.fourth.toString()}+${s.numerator}/${s.denominator * 4}`;
  }
}
export function stepNStr(s: Step): string {
  if (s.numerator === 0) {
    return s.fourth.toString();
  } else {
    return "";
  }
}