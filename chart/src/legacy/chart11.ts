import * as v from "valibot";
import {
  BPMChangeSchema9,
  ChartUntil9,
  ChartUntil9Min,
  convertTo9,
  convertTo9Min,
  NoteCommandSchema9,
  RestSchema9,
  SignatureSchema9,
  SpeedChangeSchema9,
} from "./chart9.js";
import { ChartUntil8, ChartUntil8Min } from "./chart8.js";
import { levelTypesConst } from "../chart.js";
import { getTimeSec } from "../seq.js";

export const YTBeginSchema11 = () => v.number();
export const YTEndSchema11 = () =>
  v.union([v.literal("note"), v.literal("yt"), v.number()]);
export const LevelMinSchema11 = () =>
  v.object({
    name: v.string(),
    type: v.picklist(levelTypesConst),
    unlisted: v.boolean(),
    lua: v.array(v.string()),
    ytBegin: YTBeginSchema11(),
    ytEnd: YTEndSchema11(),
    ytEndSec: v.number(),
  });
export const LevelFreezeSchema11 = () =>
  v.object({
    notes: v.array(NoteCommandSchema9()),
    rest: v.array(RestSchema9()),
    bpmChanges: v.array(BPMChangeSchema9()),
    speedChanges: v.array(SpeedChangeSchema9()),
    signature: v.array(SignatureSchema9()),
  });
export const LevelEditSchema11 = () =>
  v.object({
    ...LevelMinSchema11().entries,
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
    ytBegin: YTBeginSchema11(),
    ytEnd: YTEndSchema11(),
    ytEndSec: v.number(),
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
    levels: v.array(LevelMinSchema11()),
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
    ytBegin: level?.ytBegin || 0,
    ytEnd: level?.ytEnd || "note",
    ytEndSec: level?.ytEndSec || 0,
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
      ytBegin: level.ytBegin,
      ytEnd: level.ytEnd,
      ytEndSec: level.ytEndSec,
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
      ...level,
      ytBegin: 0,
      ytEnd: "note",
      ytEndSec:
        level.notes.length >= 1
          ? getTimeSec(
              level.bpmChanges,
              level.notes[level.notes.length - 1].step,
            )
          : 0,
    })),
  };
}
export async function convertTo11Min(
  chart: ChartUntil9Min,
): Promise<Chart11Min> {
  if (chart.ver !== 9 && chart.ver !== 10)
    chart = await convertTo9Min(chart as ChartUntil8Min);
  return {
    ...chart,
    ver: 11,
    levels: chart.levels.map((level) => ({
      ...level,
      ytBegin: 0,
      ytEnd: "note",
      ytEndSec: 0, // level.notes がないので譜面の長さの情報を取り出せない。諦める
    })),
  };
}
