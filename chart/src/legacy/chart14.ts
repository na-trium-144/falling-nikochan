// luaをLevelMinから外し、LevelEditを廃止
// snapDividerとzoomを追加

import * as v from "valibot";
import { levelTypesConst } from "../chart.js";
import {
  ChartUntil11,
  ChartUntil11Min,
  YTBeginSchema11,
  YTEndSchema11,
} from "./chart11.js";
import { NoteCommandSchema9 } from "./chart9.js";
import {
  Chart13Edit,
  Chart13Min,
  ChartUntil13,
  ChartUntil13Min,
  convertTo13,
  convertTo13Min,
  Level13Play,
  LevelFreezeSchema13,
} from "./chart13.js";

export const LevelMinSchema14 = () =>
  v.object({
    name: v.string(),
    type: v.picklist(levelTypesConst),
    unlisted: v.boolean(),
    ytBegin: YTBeginSchema11(),
    ytEnd: YTEndSchema11(),
    ytEndSec: v.number(),
    // snapの刻み幅 を1stepの4n分の1にする
    snapDivider: v.number(),
  });

export const ChartMinSchema14 = () =>
  v.object({
    falling: v.literal("nikochan"),
    ver: v.union([v.literal(14)]),
    offset: v.pipe(v.number(), v.minValue(0)),
    ytId: v.string(),
    title: v.string(),
    composer: v.string(),
    chartCreator: v.string(),
    locale: v.string(),
    levelsMin: v.array(LevelMinSchema14()),
    lua: v.array(v.array(v.string())),
    zoom: v.number(),
    copyBuffer: v.pipe(v.array(v.nullable(NoteCommandSchema9())), v.length(10)),
  });
export const ChartEditSchema14 = () =>
  v.object({
    ...ChartMinSchema14().entries,
    levelsFreeze: v.array(LevelFreezeSchema13()),
    changePasswd: v.nullable(
      v.pipe(v.string(), v.nonEmpty("Passwd must not be empty"))
    ),
    published: v.boolean(),
  });

export type Level14Min = v.InferOutput<ReturnType<typeof LevelMinSchema14>>;
export type Chart14Min = v.InferOutput<ReturnType<typeof ChartMinSchema14>>;
export type Chart14Edit = v.InferOutput<ReturnType<typeof ChartEditSchema14>>;

export function convertToPlay14(
  chart: Chart14Edit,
  lvIndex: number
): Level13Play {
  const levelMin = chart.levelsMin.at(lvIndex);
  const levelFreeze = chart.levelsFreeze.at(lvIndex);
  return {
    ver: 14,
    offset: chart.offset,
    notes: levelFreeze?.notes || [],
    bpmChanges: levelFreeze?.bpmChanges || [],
    speedChanges: levelFreeze?.speedChanges || [],
    signature: levelFreeze?.signature || [],
    ytBegin: levelMin?.ytBegin || 0,
    ytEnd: levelMin?.ytEnd || "note",
    ytEndSec: levelMin?.ytEndSec || 0,
  };
}
export function convertToMin14(chart: Chart14Edit): Chart14Min {
  return {
    falling: "nikochan",
    ver: 14,
    offset: chart.offset,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    locale: chart.locale,
    levelsMin: chart.levelsMin,
    lua: chart.lua,
    copyBuffer: chart.copyBuffer,
    zoom: chart.zoom,
  };
}

export type ChartUntil14 = ChartUntil13 | Chart14Edit;
export type ChartUntil14Min = ChartUntil13Min | Chart14Min;
export async function convertTo14(chart: ChartUntil13): Promise<Chart14Edit> {
  if (chart.ver !== 13) chart = await convertTo13(chart as ChartUntil11);
  chart satisfies Chart13Edit;
  return {
    ...chart,
    ver: 14,
    levelsMin: chart.levels.map((level) => ({
      name: level.name,
      type: level.type,
      unlisted: level.unlisted,
      ytBegin: level.ytBegin,
      ytEnd: level.ytEnd,
      ytEndSec: level.ytEndSec,
      snapDivider: 4,
    })),
    levelsFreeze: chart.levels.map((level) => ({
      notes: level.notes,
      rest: level.rest,
      bpmChanges: level.bpmChanges,
      speedChanges: level.speedChanges,
      signature: level.signature,
    })),
    lua: chart.levels.map((level) => level.lua),
    zoom: 1.0,
  };
}
export async function convertTo14Min(
  chart: ChartUntil13Min
): Promise<Chart14Min> {
  if (chart.ver !== 13) chart = await convertTo13Min(chart as ChartUntil11Min);
  chart satisfies Chart13Min;
  return {
    ...chart,
    ver: 14,
    levelsMin: chart.levels.map((level) => ({
      name: level.name,
      type: level.type,
      unlisted: level.unlisted,
      ytBegin: level.ytBegin,
      ytEnd: level.ytEnd,
      ytEndSec: level.ytEndSec,
      snapDivider: 4,
    })),
    lua: chart.levels.map((level) => level.lua),
    zoom: 1.0,
  };
}
