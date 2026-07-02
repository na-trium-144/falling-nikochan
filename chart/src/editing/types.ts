import { LevelFreeze } from "../chart.js";

export const eventTypes = [
  "rerender", // 再render用
  "change", // toObject()で出力するデータに変化があるとき (session管理 & hasChange で使う)
  "levelIndex", // currentLevelIndexが変化したとき
] as const;
export type EventType = (typeof eventTypes)[number];

export interface LuaExecutorLastResult {
  stdout: string[];
  err: string[];
  errLine: number | null;
  levelIndex: number;
}
export interface LuaExecutor {
  result: LuaExecutorLastResult | null;
  running: boolean;
  clearResult: () => void;
  exec: (code: string, levelIndex: number) => Promise<LevelFreeze | null>;
  abortExec: () => void;
}
export type LuaExecutorRef = { current: LuaExecutor };
