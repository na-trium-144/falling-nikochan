import { LevelFreeze } from "../chart.js";
import { Step } from "../step.js";

export const eventTypes = [
  "rerender", // 再render用
  "change", // toObject()で出力するデータに変化があるとき (session管理 & hasChange で使う)
  "levelIndex", // currentLevelIndexが変化したとき
] as const;
export type EventType = (typeof eventTypes)[number];

export interface LuaExecResultSuccess {
  stdout: string[];
  err: string[];
  errorLine: null;
  levelFreezed: LevelFreeze;
  rawReturnValue: unknown;
  step: Step;
}
export interface LuaExecResultError {
  stdout: string[];
  err: string[];
  errorLine: number | null;
  levelFreezed: null;
  rawReturnValue: unknown;
  step: null;
}
export type LuaExecResult = LuaExecResultSuccess | LuaExecResultError;
export interface LuaExecOptions {
  catchError?: boolean;
  needReturnValue?: boolean;
  isChartFile?: boolean;
}

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
  exec: (
    code: string,
    levelIndex: number,
    options: LuaExecOptions
  ) => Promise<LuaExecResult>;
  abortExec: () => void;
}
export type LuaExecutorRef = { current: LuaExecutor };
