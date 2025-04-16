function bestKey(cid: string, lvHash: string) {
  return `best-${cid}-${lvHash.slice(0, 8)}`;
}
export interface ResultData {
  baseScore: number;
  chainScore: number;
  bigScore: number;
  judgeCount: [number, number, number, number];
}
interface ResultDataOld extends ResultData {
  levelHash: string;
}
export function getBestScore(cid: string, lvHash: string): ResultData | null {
  let bestScore: ResultData | null = JSON.parse(
    localStorage.getItem(bestKey(cid, lvHash)) || "null"
  );
  if (!bestScore) {
    for (let i = 0; i < 10; i++) {
      const oldKey = `best-${cid}-${i}`;
      const oldScore: ResultDataOld | null = JSON.parse(
        localStorage.getItem(oldKey) || "null"
      );
      if (oldScore && oldScore.levelHash === lvHash) {
        bestScore = {
          baseScore: oldScore.baseScore,
          chainScore: oldScore.chainScore,
          bigScore: oldScore.bigScore,
          judgeCount: oldScore.judgeCount,
        };
        localStorage.setItem(bestKey(cid, lvHash), JSON.stringify(bestScore));
        localStorage.removeItem(oldKey);
        break;
      }
    }
  }
  return bestScore;
}
export function setBestScore(cid: string, lvHash: string, data: ResultData) {
  localStorage.setItem(bestKey(cid, lvHash), JSON.stringify(data));
}
export function clearBestScore(cid: string, lvHash: string) {
  localStorage.removeItem(bestKey(cid, lvHash));
}
