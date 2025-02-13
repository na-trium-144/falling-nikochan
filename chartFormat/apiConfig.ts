export const rateLimitMin = 10;
export const chartMaxSize = 1000000;

export function validCId(cid: string) {
  return cid.length === 6 && Number(cid) >= 100000 && Number(cid) < 1000000;
}

export const originalCId = ["602399", "983403"];
export const sampleCId = ["596134", "592994", "488006", "850858", "768743"];
export function isSample(cid: string) {
  return sampleCId.includes(cid) || originalCId.includes(cid);
}
