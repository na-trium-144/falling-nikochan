function bestKey(cid: string) {
  return "best-" + cid;
}
export function getBestScore(cid: string): number {
  return Number(localStorage.getItem(bestKey(cid)) || "");
}

export function setBestScore(cid: string, score: number) {
  localStorage.setItem(bestKey(cid), score.toString());
}
