export const numLatest = 24;
export const popularDays = 3;
export const rateLimitMin = 10;
export const chartMaxEvent = 20000;
export const fileMaxSize = chartMaxEvent * (100 + 150);
// luaコードは1コマンドあたり100byteもあれば十分
// Step: 26 + 27 = 53
// NoteCommand: 32 + 38 + 53 = 123
// RestStep: 20 + 9 + 53 * 2 = 135
// BPMChange: 21 + 27 + 53 = 101
// Signature: 27 + 30くらい + 53 * 2 = 133

export const originalCId = ["602399", "983403"];
export const sampleCId = ["596134", "592994", "488006", "850858", "768743"];
export function isSample(cid: string) {
  return sampleCId.includes(cid) || originalCId.includes(cid);
}
