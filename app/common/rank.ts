export function rankStr(score: number): string {
  const ranks = ["S+", "S", "A+", "A", "B+", "B", "C"];
  let rank: string = "C";
  for (let i = 0; i < ranks.length; i++) {
    if (score >= 120 - i * 10 - 0.005) {
      rank = ranks[i];
      break;
    }
  }
  return rank;
}
