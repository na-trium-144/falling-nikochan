import * as v from "valibot";
import { levelTypes, levelTypesConst, LuaLineSchema } from "../chart.js";
import { StepSchema } from "../step.js";
import {
  BPMChangeSchema9,
  ChartUntil9,
  ChartUntil9Min,
  convertTo9,
  convertTo9Min,
  LevelMinSchema9,
  NoteCommandSchema9,
  RestSchema9,
  SignatureSchema9,
  SpeedChangeSchema9,
} from "./chart9.js";
import { ChartUntil8, ChartUntil8Min } from "./chart8.js";

export const YTBeginSchema11 = () =>
  v.object({
    timeSec: v.number(),
    luaLine: LuaLineSchema(),
  });
export const YTEndSchema11 = () =>
  v.object({
    timeSec: v.union([v.literal("note"), v.literal("yt"), v.number()]),
    luaLine: LuaLineSchema(),
  });
export const LevelFreezeSchema11 = () =>
  v.object({
    ytBegin: YTBeginSchema11(),
    ytEnd: YTEndSchema11(),
    notes: v.array(NoteCommandSchema9()),
    rest: v.array(RestSchema9()),
    bpmChanges: v.array(BPMChangeSchema9()),
    speedChanges: v.array(SpeedChangeSchema9()),
    signature: v.array(SignatureSchema9()),
  });
export const LevelEditSchema11 = () =>
  v.object({
    ...LevelMinSchema9().entries,
    ...LevelFreezeSchema11().entries,
  });
export const LevelPlaySchema11 = () =>
  v.object({
    ver: v.union([v.literal(11)]),
    offset: v.pipe(v.number(), v.minValue(0)),
    notes: v.array(NoteCommandSchema9()),
    bpmChanges: v.array(BPMChangeSchema9()),
    speedChanges: v.array(SpeedChangeSchema9()),
    signature: v.array(SignatureSchema9()),
  });

export const ChartMinSchema11 = () =>
  v.object({
    falling: v.literal("nikochan"),
    ver: v.union([v.literal(11)]),
    offset: v.pipe(v.number(), v.minValue(0)),
    // ytId: YoutubeIdSchema(),
    ytId: v.string(),
    title: v.string(),
    composer: v.string(),
    chartCreator: v.string(),
    locale: v.string(),
    levels: v.array(LevelMinSchema9()),
  });
export const ChartEditSchema11 = () =>
  v.object({
    ...ChartMinSchema11().entries,
    levels: v.array(LevelEditSchema11()),
    changePasswd: v.nullable(
      v.pipe(v.string(), v.nonEmpty("Passwd must not be empty")),
    ),
    published: v.boolean(),
  });

export type YTBegin11 = v.InferOutput<ReturnType<typeof YTBeginSchema11>>;
export type YTEnd11 = v.InferOutput<ReturnType<typeof YTEndSchema11>>;
export type Level11Freeze = v.InferOutput<
  ReturnType<typeof LevelFreezeSchema11>
>;
export type Level11Edit = v.InferOutput<ReturnType<typeof LevelEditSchema11>>;
export type Level11Play = v.InferOutput<ReturnType<typeof LevelPlaySchema11>>;
export type Chart11Min = v.InferOutput<ReturnType<typeof ChartMinSchema11>>;
export type Chart11Edit = v.InferOutput<ReturnType<typeof ChartEditSchema11>>;

export function convertToPlay11(
  chart: Chart11Edit,
  lvIndex: number,
): Level11Play {
  const level = chart.levels.at(lvIndex);
  return {
    ver: 11,
    offset: chart.offset,
    notes: level?.notes || [],
    bpmChanges: level?.bpmChanges || [],
    speedChanges: level?.speedChanges || [],
    signature: level?.signature || [],
  };
}
export function convertToMin11(chart: Chart11Edit): Chart11Min {
  return {
    falling: "nikochan",
    ver: 11,
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
    })),
  };
}

export type ChartUntil11 = ChartUntil9 | Chart11Edit;
export type ChartUntil11Min = ChartUntil9Min | Chart11Min;
export async function convertTo11(chart: ChartUntil9): Promise<Chart11Edit> {
  if (chart.ver !== 9 && chart.ver !== 10)
    chart = await convertTo9(chart as ChartUntil8);
  return {
    ...chart,
    ver: 11,
    levels: chart.levels.map((level) => ({
      name: level.name,
      type: levelTypes.includes(level.type)
        ? (level.type as "Single" | "Double" | "Maniac")
        : "Maniac",
      lua: level.lua,
      unlisted: level.unlisted,
      notes: level.notes,
      rest: level.rest,
      bpmChanges: level.bpmChanges,
      speedChanges: level.speedChanges,
      signature: level.signature,
    })),
  };
}
export async function convertTo11Min(
  chart: ChartUntil9Min,
): Promise<Chart11Min> {
  if (chart.ver !== 9 && chart.ver !== 10)
    chart = await convertTo9Min(chart as ChartUntil8Min);
  return { ...chart, ver: 11 };
}
