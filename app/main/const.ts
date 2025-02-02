export const tabTitles = [
  "Falling Nikochan とは？",
  "プレイする",
  "譜面作成",
  "利用規約っぽいもの",
  // ↓ hidden page (トップページにリンクが表示されない)
  "バージョン情報",
];
export const tabURLs = [
  "/main/about/1",
  "/main/play",
  "/main/edit",
  "/main/policies",
];

export const originalCId = ["602399", "983403"];
export const sampleCId = ["596134", "592994", "488006", "850858", "768743"];
export function isSample(cid: string) {
  return sampleCId.includes(cid) || originalCId.includes(cid);
}