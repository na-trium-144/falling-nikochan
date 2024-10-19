import { Signature } from "@/chartFormat/command";
import { getSignatureState } from "@/chartFormat/seq";
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

export function stepNStr(s: Step, sig: Signature[]): string {
  const ss = getSignatureState(sig, s);
  if (ss.offset.numerator === 0) {
    return `${ss.barNum + 1};${ss.offset.fourth + 1}`;
  } else {
    return "";
  }
}
