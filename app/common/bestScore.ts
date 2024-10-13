function bestKey(cid: string, lvIndex: number) {
  return "best-" + cid + "-" + lvIndex;
}
export interface ResultData {
  levelHash: string;
  baseScore: number;
  chainScore: number;
  bigScore: number;
  judgeCount: [number, number, number, number];
}
export function getBestScore(cid: string, lvIndex: number): ResultData | null {
  return JSON.parse(localStorage.getItem(bestKey(cid, lvIndex)) || "null");
}
export function setBestScore(cid: string, lvIndex: number, data: ResultData) {
  localStorage.setItem(bestKey(cid, lvIndex), JSON.stringify(data));
}
export function clearBestScore(cid: string, lvIndex: number) {
  localStorage.removeItem(bestKey(cid, lvIndex));
}
