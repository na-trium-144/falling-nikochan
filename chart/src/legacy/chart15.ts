// levelMin->levelMeta
// copyBuffer仕様変更

import * as v from "valibot";
import { ArrayOrEmptyObj, levelTypesConst } from "../chart.js";
import { YTBeginSchema11, YTEndSchema11 } from "./chart11.js";
import {
  BPMChangeSchema9,
  NoteCommandSchema9,
  RestSchema9,
  SignatureSchema9,
} from "./chart9.js";
import { ChartUntil13, SpeedChangeSchema13 } from "./chart13.js";
import {
  Chart14Edit,
  ChartUntil14,
  ChartUntil14Min,
  convertTo14,
} from "./chart14.js";

export const LevelMetaSchema15 = () =>
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
export const LevelFreezeSchema15 = () =>
  v.object({
    notes: ArrayOrEmptyObj(NoteCommandSchema9()),
    rest: ArrayOrEmptyObj(RestSchema9()),
    bpmChanges: ArrayOrEmptyObj(BPMChangeSchema9()),
    speedChanges: ArrayOrEmptyObj(SpeedChangeSchema13()),
    signature: ArrayOrEmptyObj(SignatureSchema9()),
  });
export const LevelPlaySchema15 = () =>
  v.object({
    ver: v.union([v.literal(15)]),
    offset: v.pipe(v.number(), v.minValue(0)),
    notes: v.array(NoteCommandSchema9()),
    bpmChanges: v.array(BPMChangeSchema9()),
    speedChanges: v.array(SpeedChangeSchema13()),
    signature: v.array(SignatureSchema9()),
    ytBegin: YTBeginSchema11(),
    ytEndSec: v.number(),
  });

export const CopyBufferEntrySchema = () =>
  v.tuple([
    v.number(), // x
    v.number(), // vx
    v.number(), // vy
    v.boolean(), // big
    v.boolean(), // fall
  ]);
// luaTableをパースして得られるオブジェクト
// (luaからnilを含む配列を返すことができないため)
export const CopyBufferSchema = () =>
  v.object(
    Object.fromEntries(
      Array.from(new Array(10), (_, i) => [
        String(i), // 0-9
        v.optional(CopyBufferEntrySchema()),
      ])
    )
  );

export const ChartSchema15 = () =>
  v.pipe(
    v.object({
      falling: v.literal("nikochan"),
      ver: v.union([v.literal(15)]),
      offset: v.pipe(v.number(), v.minValue(0)),
      ytId: v.string(),
      title: v.string(),
      composer: v.string(),
      chartCreator: v.string(),
      locale: v.string(),
      levelsMeta: ArrayOrEmptyObj(LevelMetaSchema15()),
      lua: v.array(v.array(v.string())),
      // エディターの拡大率、 1.5^x 倍にする
      zoom: v.pipe(v.number(), v.integer()),
      copyBuffer: CopyBufferSchema(),
      levelsFreeze: ArrayOrEmptyObj(LevelFreezeSchema15()),
      changePasswd: v.optional(
        v.nullable(v.pipe(v.string(), v.nonEmpty("Passwd must not be empty"))),
        null
      ),
      published: v.boolean(),
    }),
    v.check(
      (min) => min.levelsMeta.length === min.lua.length,
      "levelsMeta.length and lua.length does not match"
    ),
    v.check(
      (min) => min.levelsMeta.length === min.levelsFreeze.length,
      "levelsMeta.length and levelsFreeze.length does not match"
    )
  );

export type CopyBuffer = v.InferOutput<ReturnType<typeof CopyBufferSchema>>;
export type CopyBufferEntry = v.InferOutput<
  ReturnType<typeof CopyBufferEntrySchema>
>;
export type Level15Meta = v.InferOutput<ReturnType<typeof LevelMetaSchema15>>;
export type Level15Freeze = v.InferOutput<
  ReturnType<typeof LevelFreezeSchema15>
>;
export type Level15Play = v.InferOutput<ReturnType<typeof LevelPlaySchema15>>;
export type Chart15 = v.InferOutput<ReturnType<typeof ChartSchema15>>;

export function convertToPlay15(chart: Chart15, lvIndex: number): Level15Play {
  const levelMin = chart.levelsMeta.at(lvIndex);
  const levelFreeze = chart.levelsFreeze.at(lvIndex);
  return {
    ver: 15,
    offset: chart.offset,
    notes: levelFreeze?.notes || [],
    bpmChanges: levelFreeze?.bpmChanges || [],
    speedChanges: levelFreeze?.speedChanges || [],
    signature: levelFreeze?.signature || [],
    ytBegin: levelMin?.ytBegin || 0,
    ytEndSec: levelMin?.ytEndSec || 0,
  };
}

export type ChartUntil15 = ChartUntil14 | Chart15;
export type ChartUntil15Min = ChartUntil14Min | Chart15;
export async function convertTo15(chart: ChartUntil14): Promise<Chart15> {
  if (chart.ver !== 14) chart = await convertTo14(chart as ChartUntil13);
  chart satisfies Chart14Edit;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { levelsMin, ...others } = chart;
  return {
    ...others,
    ver: 15,
    levelsMeta: chart.levelsMin,
    copyBuffer: Object.fromEntries(
      chart.copyBuffer.map((entry, i) => [
        String(i),
        entry
          ? [entry.hitX, entry.hitVX, entry.hitVY, entry.big, entry.fall]
          : undefined,
      ])
    ),
  };
}
