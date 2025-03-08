import * as v from "valibot";
import {
  HashSchema,
  levelTypes,
  levelTypesConst,
  LuaLineSchema,
  YoutubeIdSchema,
} from "../chart.js";
import { StepSchema } from "../step.js";
import { Chart1 } from "./chart1.js";
import { Chart2 } from "./chart2.js";
import { Chart3 } from "./chart3.js";
import { Chart4 } from "./chart4.js";
import { Chart5 } from "./chart5.js";
import { Chart6 } from "./chart6.js";
import { Chart7 } from "./chart7.js";
import { Chart8Edit, Chart8Min, convertTo8 } from "./chart8.js";

export const NoteCommandSchema9 = v.object({
  step: StepSchema,
  big: v.boolean(),
  hitX: v.number(),
  hitVX: v.number(),
  hitVY: v.number(),
  fall: v.boolean(),
  luaLine: LuaLineSchema,
});
export const RestSchema9 = v.object({
  begin: StepSchema,
  duration: StepSchema,
  luaLine: LuaLineSchema,
});
export const BPMChangeSchema9 = v.object({
  step: StepSchema,
  bpm: v.pipe(v.number(), v.gtValue(0)),
  timeSec: v.pipe(v.number(), v.minValue(0)),
  luaLine: LuaLineSchema,
});
export const SpeedChangeSchema9 = v.object({
  step: StepSchema,
  bpm: v.number(),
  timeSec: v.pipe(v.number(), v.minValue(0)),
  luaLine: LuaLineSchema,
});
export const SignatureSchema9 = v.object({
  step: StepSchema,
  offset: StepSchema,
  barNum: v.pipe(v.number(), v.integer(), v.minValue(0)),
  bars: v.array(v.array(v.picklist([4, 8, 16] as const))),
  luaLine: LuaLineSchema,
});

export const LevelMinSchema9 = v.object({
  name: v.string(),
  type: v.picklist(levelTypesConst),
  unlisted: v.boolean(),
  lua: v.array(v.string()),
});
export const LevelFreezeSchema9 = v.object({
  notes: v.array(NoteCommandSchema9),
  rest: v.array(RestSchema9),
  bpmChanges: v.array(BPMChangeSchema9),
  speedChanges: v.array(SpeedChangeSchema9),
  signature: v.array(SignatureSchema9),
});
export const LevelEditSchema9 = v.object({
  ...LevelMinSchema9.entries,
  ...LevelFreezeSchema9.entries,
});
export const LevelPlaySchema9 = v.object({
  ver: v.literal(9),
  offset: v.pipe(v.number(), v.minValue(0)),
  notes: v.array(NoteCommandSchema9),
  bpmChanges: v.array(BPMChangeSchema9),
  speedChanges: v.array(SpeedChangeSchema9),
  signature: v.array(SignatureSchema9),
});

export const ChartMinSchema9 = v.object({
  falling: v.literal("nikochan"),
  ver: v.literal(9),
  offset: v.pipe(v.number(), v.minValue(0)),
  ytId: YoutubeIdSchema,
  title: v.string(),
  composer: v.string(),
  chartCreator: v.string(),
  locale: v.string(),
  levels: v.array(LevelMinSchema9),
});
export const ChartEditSchema9 = v.object({
  ...ChartMinSchema9.entries,
  levels: v.array(LevelEditSchema9),
  editPasswdHash: HashSchema,
  published: v.boolean(),
});

export type NoteCommand9 = v.InferOutput<typeof NoteCommandSchema9>;
export type Rest9 = v.InferOutput<typeof RestSchema9>;
export type BPMChange9 = v.InferOutput<typeof BPMChangeSchema9>;
export type SpeedChange9 = v.InferOutput<typeof SpeedChangeSchema9>;
export type Signature9 = v.InferOutput<typeof SignatureSchema9>;
export type Level9Min = v.InferOutput<typeof LevelMinSchema9>;
export type Level9Freeze = v.InferOutput<typeof LevelFreezeSchema9>;
export type Level9Edit = v.InferOutput<typeof LevelEditSchema9>;
export type Level9Play = v.InferOutput<typeof LevelPlaySchema9>;
export type Chart9Min = v.InferOutput<typeof ChartMinSchema9>;
export type Chart9Edit = v.InferOutput<typeof ChartEditSchema9>;

export function convertToPlay9(chart: Chart9Edit, lvIndex: number): Level9Play {
  const level = chart.levels.at(lvIndex);
  return {
    ver: 9,
    offset: chart.offset,
    notes: level?.notes || [],
    bpmChanges: level?.bpmChanges || [],
    speedChanges: level?.speedChanges || [],
    signature: level?.signature || [],
  };
}
export function convertToMin9(chart: Chart9Edit): Chart9Min {
  return {
    falling: "nikochan",
    ver: 9,
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
export async function convertTo9(
  chart:
    | Chart1
    | Chart2
    | Chart3
    | Chart4
    | Chart5
    | Chart6
    | Chart7
    | Chart8Edit
): Promise<Chart9Edit> {
  if (chart.ver !== 8) chart = await convertTo8(chart);
  return {
    falling: "nikochan",
    ver: 9,
    offset: chart.offset,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    locale: chart.locale,
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
    editPasswdHash: "",
    published: chart.published,
  };
}
export async function convertTo9Min(
  chart:
    | Chart1
    | Chart2
    | Chart3
    | Chart4
    | Chart5
    | Chart6
    | Chart7
    | Chart8Min
): Promise<Chart9Min> {
  if (chart.ver !== 8) chart = await convertTo8(chart);
  return {
    falling: "nikochan",
    ver: 9,
    offset: chart.offset,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    locale: chart.locale,
    levels: chart.levels.map((level) => ({
      name: level.name,
      type: levelTypes.includes(level.type)
        ? (level.type as "Single" | "Double" | "Maniac")
        : "Maniac",
      lua: level.lua,
      unlisted: level.unlisted,
    })),
  };
}
