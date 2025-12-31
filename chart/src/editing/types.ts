import { LevelFreeze } from "../chart.js";

export const eventTypes = [
  "rerender", // 再render用
  "change", // toObject()で出力するデータに変化があるとき (session管理 & hasChange で使う)
] as const;
export type EventType = (typeof eventTypes)[number];

export interface LuaExecutor {
  stdout: string[];
  err: string[];
  errLine: number | null;
  running: boolean;
  exec: (code: string) => Promise<LevelFreeze | null>;
  abortExec: () => void;
}
export type LuaExecutorRef = { current: LuaExecutor };
