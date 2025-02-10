export const tabTitleKeys = [
  "about",
  "play",
  "edit",
  "policies",
  // ↓ hidden page (トップページにリンクが表示されない)
  "version",
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
