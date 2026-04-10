export const numLatest = 24;
export const popularDays = 3;
export const rateLimit = {
  newChartFile: 600,
  chartFile: 3,
  record: 10,
} as const;
export const chartMaxEvent = 20000;
export const fileMaxSize = chartMaxEvent * (100 + 150);
// luaコードは1コマンドあたり100byteもあれば十分
// Step: 26 + 27 = 53
// NoteCommand: 32 + 38 + 53 = 123
// RestStep: 20 + 9 + 53 * 2 = 135
// BPMChange: 21 + 27 + 53 = 101
// Signature: 27 + 30くらい + 53 * 2 = 133

export const maxLv = 20;
export const minLv = 1;
