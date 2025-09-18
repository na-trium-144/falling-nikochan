// ver11->ver13: speedChangeにinterpパラメータを追加
// interp: true の場合、前のBPMから徐々に変化する。

import * as v from "valibot";
import { StepSchema } from "../step.js";
import { LuaLineSchema } from "../chart.js";
import {
  BPMChangeSchema9,
  ChartUntil9,
  ChartUntil9Min,
  NoteCommandSchema9,
  RestSchema9,
  SignatureSchema9,
} from "./chart9.js";
import {
    Chart11Edit,
  Chart11Min,
  ChartUntil11,
  ChartUntil11Min,
  convertTo11,
  convertTo11Min,
  LevelMinSchema11,
  YTBeginSchema11,
  YTEndSchema11,
} from "./chart11.js";

export const SpeedChangeSchema13 = () =>
  v.object({
    step: StepSchema(),
    bpm: v.number(),
    interp: v.boolean(),
    timeSec: v.pipe(v.number(), v.minValue(0)),
    luaLine: LuaLineSchema(),
  });

export const LevelFreezeSchema13 = () =>
  v.object({
    notes: v.array(NoteCommandSchema9()),
    rest: v.array(RestSchema9()),
    bpmChanges: v.array(BPMChangeSchema9()),
    speedChanges: v.array(SpeedChangeSchema13()),
    signature: v.array(SignatureSchema9()),
  });
export const LevelEditSchema13 = () =>
  v.object({
    ...LevelMinSchema11().entries,
    ...LevelFreezeSchema13().entries,
  });
export const LevelPlaySchema13 = () =>
  v.object({
    ver: v.union([v.literal(13)]),
    offset: v.pipe(v.number(), v.minValue(0)),
    notes: v.array(NoteCommandSchema9()),
    bpmChanges: v.array(BPMChangeSchema9()),
    speedChanges: v.array(SpeedChangeSchema13()),
    signature: v.array(SignatureSchema9()),
    ytBegin: YTBeginSchema11(),
    ytEnd: YTEndSchema11(),
    ytEndSec: v.number(),
  });

export const ChartMinSchema13 = () =>
  v.object({
    falling: v.literal("nikochan"),
    ver: v.union([v.literal(13)]),
    offset: v.pipe(v.number(), v.minValue(0)),
    // ytId: YoutubeIdSchema(),
    ytId: v.string(),
    title: v.string(),
    composer: v.string(),
    chartCreator: v.string(),
    locale: v.string(),
    levels: v.array(LevelMinSchema11()),
    copyBuffer: v.pipe(v.array(v.nullable(NoteCommandSchema9())), v.length(10)),
  });
export const ChartEditSchema13 = () =>
  v.object({
    ...ChartMinSchema13().entries,
    levels: v.array(LevelEditSchema13()),
    changePasswd: v.nullable(
      v.pipe(v.string(), v.nonEmpty("Passwd must not be empty"))
    ),
    published: v.boolean(),
  });

export type SpeedChangeWithLua13 = v.InferOutput<ReturnType<typeof SpeedChangeSchema13>>;
export type SpeedChange13 = Omit<SpeedChangeWithLua13, "luaLine">;
export type Level13Freeze = v.InferOutput<
  ReturnType<typeof LevelFreezeSchema13>
>;
export type Level13Edit = v.InferOutput<ReturnType<typeof LevelEditSchema13>>;
export type Level13Play = v.InferOutput<ReturnType<typeof LevelPlaySchema13>>;
export type Chart13Min = v.InferOutput<ReturnType<typeof ChartMinSchema13>>;
export type Chart13Edit = v.InferOutput<ReturnType<typeof ChartEditSchema13>>;

export function convertToPlay13(
  chart: Chart13Edit,
  lvIndex: number
): Level13Play {
  const level = chart.levels.at(lvIndex);
  return {
    ver: 13,
    offset: chart.offset,
    notes: level?.notes || [],
    bpmChanges: level?.bpmChanges || [],
    speedChanges: level?.speedChanges || [],
    signature: level?.signature || [],
    ytBegin: level?.ytBegin || 0,
    ytEnd: level?.ytEnd || "note",
    ytEndSec: level?.ytEndSec || 0,
  };
}
export function convertToMin13(chart: Chart13Edit): Chart13Min {
  return {
    falling: "nikochan",
    ver: 13,
    offset: chart.offset,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    locale: chart.locale,
    levels: chart.levels.map((level) => ({
      name: level.name,
      type: level.type,
      unlisted: level.unlisted,
      lua: level.lua,
      ytBegin: level.ytBegin,
      ytEnd: level.ytEnd,
      ytEndSec: level.ytEndSec,
    })),
    copyBuffer: chart.copyBuffer,
  };
}

export type ChartUntil13 = ChartUntil11 | Chart13Edit;
export type ChartUntil13Min = ChartUntil11Min | Chart13Min;
export async function convertTo13(chart: ChartUntil11): Promise<Chart13Edit> {
  if (chart.ver !== 11 && chart.ver !== 12)
    chart = await convertTo11(chart as ChartUntil9);
  chart satisfies Chart11Edit;
  return {
    ...chart,
    ver: 13,
    levels: chart.levels.map((level) => ({
      ...level,
      speedChanges: level.speedChanges.map((sc) => ({
        ...sc,
        interp: false,
      })),
    })),
  };
}
export async function convertTo13Min(
  chart: ChartUntil11Min
): Promise<Chart13Min> {
  if (chart.ver !== 11 && chart.ver !== 12)
    chart = await convertTo11Min(chart as ChartUntil9Min);
  chart satisfies Chart11Min;
  return {
    ...chart,
    ver: 13,
  };
}
