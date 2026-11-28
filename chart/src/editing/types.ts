import { LevelFreezeSchema } from "../chart.js";
import { StepSchema } from "../step.js";
import * as v from "valibot";

export const eventTypes = [
  "rerender", // 再render用
  "change", // toObject()で出力するデータに変化があるとき (session管理 & hasChange で使う)
  "levelIndex", // currentLevelIndexが変化したとき
] as const;
export type EventType = (typeof eventTypes)[number];

export const LuaExecResultSuccessSchema = () =>
  v.object({
    stdout: v.array(v.string()),
    err: v.array(v.string()),
    errorLine: v.null(),
    levelFreezed: LevelFreezeSchema(),
    rawReturnValue: v.unknown(),
    step: StepSchema(),
  });
export const LuaExecResultErrorSchema = () =>
  v.object({
    stdout: v.array(v.string()),
    err: v.array(v.string()),
    errorLine: v.nullable(v.number()),
    levelFreezed: v.null(),
    rawReturnValue: v.unknown(),
    step: v.null(),
  });
export type LuaExecResultSuccess = v.InferOutput<
  ReturnType<typeof LuaExecResultSuccessSchema>
>;
export type LuaExecResultError = v.InferOutput<
  ReturnType<typeof LuaExecResultErrorSchema>
>;
export const LuaExecResultSchema = () =>
  v.union([LuaExecResultSuccessSchema(), LuaExecResultErrorSchema()]);
export type LuaExecResult = v.InferOutput<
  ReturnType<typeof LuaExecResultSchema>
>;
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
