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
    return (
      (Math.floor(s.fourth / 4) + 1).toString() +
      ";" +
      ((s.fourth % 4) + 1).toString()
    );
  } else {
    return (
      (Math.floor(s.fourth / 4) + 1).toString() +
      ";" +
      ((s.fourth % 4) + 1).toString() +
      "+" +
      s.numerator.toString() +
      "/" +
      (s.denominator * 4).toString()
    );
  }
}
// todo: 拍子を考慮
export function stepNStr(s: Step): string {
  if (s.numerator === 0) {
    return (
      (Math.floor(s.fourth / 4) + 1).toString() +
      ";" +
      ((s.fourth % 4) + 1).toString()
    );
  } else {
    return "";
  }
}
