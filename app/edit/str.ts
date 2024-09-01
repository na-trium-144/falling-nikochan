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
