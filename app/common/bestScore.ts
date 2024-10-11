function bestKey(cid: string, hash: string) {
  return "best-" + cid + "-" + hash;
}
export function getBestScore(cid: string, hash: string): number {
  return Number(localStorage.getItem(bestKey(cid, hash)) || "");
}

export function setBestScore(cid: string, hash: string, score: number) {
  localStorage.setItem(bestKey(cid, hash), score.toString());
}
