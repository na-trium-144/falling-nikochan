// notes.longFrom

import * as v from "valibot";
import { StepSchema } from "../step.js";
import {
  ArrayDoc,
  ArrayOrEmptyObj,
  ArrayOrEmptyObjDoc,
  LuaLineSchema,
} from "../chart.js";
import { docRefs, Schema } from "../docSchema.js";
import { resolver } from "hono-openapi";
import {
  BPMChangeSchema15,
  Chart15,
  ChartUntil15,
  ChartUntil15Min,
  convertTo15,
  CopyBufferSchema,
  LevelMetaSchema15,
  RestSchema15,
  SignatureSchema15,
  SpeedChangeSchema15,
  YTBeginSchema15,
  YTEndSecSchema15,
} from "./chart15.js";
import { ChartUntil14 } from "./chart14.js";

export const NoteCommandSchema17 = () =>
  v.pipe(
    v.object({
      step: StepSchema(),
      big: v.pipe(
        v.boolean(),
        v.description("Whether the note is a big note or not")
      ),
      hitX: v.pipe(
        v.number(),
        v.description(
          "The x coordinate of the note when hit. " +
            "left edge: -5.0 - right edge: +5.0"
        )
      ),
      hitVX: v.pipe(
        v.number(),
        v.description("The x velocity of the note when hit")
      ),
      hitVY: v.pipe(
        v.number(),
        v.description("The y velocity of the note when hit")
      ),
      fall: v.pipe(
        v.boolean(),
        v.description(
          "Whether the note falls from the top of the screen, or thrown up from the bottom"
        )
      ),
      luaLine: LuaLineSchema(),
      longFrom: v.pipe(
        ArrayOrEmptyObj(v.pipe(v.number(), v.integer(), v.ltValue(0))),
        v.description(
          "Empty array represents a single tap note. [-n] represents a long note connected to the n-th previous note."
        )
      ),
    }),
    v.description("A note command described by hit position and velocity.")
  );
export async function NoteCommand17Doc(): Promise<Schema> {
  const schema = (await resolver(NoteCommandSchema17()).toOpenAPISchema())
    .schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      step: docRefs("Step"),
      luaLine: docRefs("LuaLine"),
    },
  };
}

export const LevelFreezeSchema17 = () =>
  v.object({
    notes: ArrayOrEmptyObj(NoteCommandSchema17()),
    rest: ArrayOrEmptyObj(RestSchema15()),
    bpmChanges: ArrayOrEmptyObj(BPMChangeSchema15()),
    speedChanges: ArrayOrEmptyObj(SpeedChangeSchema15()),
    signature: ArrayOrEmptyObj(SignatureSchema15()),
  });
export async function LevelFreeze17Doc(): Promise<Schema> {
  const schema = (await resolver(LevelFreezeSchema17()).toOpenAPISchema())
    .schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      notes: ArrayOrEmptyObjDoc(docRefs("NoteCommand17")),
      rest: ArrayOrEmptyObjDoc(docRefs("Rest15")),
      bpmChanges: ArrayOrEmptyObjDoc(docRefs("BPMChange15")),
      speedChanges: ArrayOrEmptyObjDoc(docRefs("SpeedChange15")),
      signature: ArrayOrEmptyObjDoc(docRefs("Signature15")),
    },
  };
}

export const LevelPlaySchema17 = () =>
  v.object({
    ver: v.union([v.literal(17)]),
    offset: v.pipe(v.number(), v.minValue(0)),
    notes: v.array(NoteCommandSchema17()),
    bpmChanges: v.array(BPMChangeSchema15()),
    speedChanges: v.array(SpeedChangeSchema15()),
    signature: v.array(SignatureSchema15()),
    ytBegin: YTBeginSchema15(),
    ytEndSec: YTEndSecSchema15(),
  });
export async function LevelPlay17Doc(): Promise<Schema> {
  const schema = (await resolver(LevelPlaySchema17()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      notes: ArrayDoc(docRefs("NoteCommand17")),
      bpmChanges: ArrayDoc(docRefs("BPMChange15")),
      speedChanges: ArrayDoc(docRefs("SpeedChange15")),
      signature: ArrayDoc(docRefs("Signature15")),
      ytBegin: docRefs("YTBegin15"),
      ytEndSec: docRefs("YTEndSec15"),
    },
  };
}

export const ChartSchema17 = () =>
  v.pipe(
    v.object({
      falling: v.literal("nikochan"),
      ver: v.union([v.literal(17)]),
      offset: v.pipe(v.number(), v.minValue(0)),
      ytId: v.string(),
      title: v.string(),
      composer: v.string(),
      chartCreator: v.string(),
      locale: v.pipe(
        v.string(),
        v.description(
          "Locale where this chart was created, e.g. 'jp', 'en', " +
            "though this field is currently not used for anything."
        )
      ),
      levelsMeta: ArrayOrEmptyObj(LevelMetaSchema15()),
      lua: v.pipe(
        v.array(v.array(v.string())),
        v.description(
          "Lua source code split by line. " +
            "Only used for editing in the chart editor, and is ignored in server side."
        )
      ),
      zoom: v.pipe(
        v.number(),
        v.integer(),
        v.description("Editor zoom level, where the zoom ratio is 1.5^x")
      ),
      copyBuffer: CopyBufferSchema(),
      levelsFreeze: ArrayOrEmptyObj(LevelFreezeSchema17()),
      changePasswd: v.pipe(
        v.optional(
          v.nullable(
            v.pipe(v.string(), v.nonEmpty("Passwd must not be empty"))
          ),
          null
        ),
        v.description(
          "When this field is not null on POST request, " +
            "the server changes the chart passwd to this value."
        )
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
export async function Chart17Doc(): Promise<Schema> {
  const schema = (await resolver(ChartSchema17()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      copyBuffer: docRefs("CopyBuffer"),
      levelsMeta: ArrayOrEmptyObjDoc(docRefs("LevelMeta15")),
      levelsFreeze: ArrayOrEmptyObjDoc(docRefs("LevelFreeze17")),
    },
  };
}

export type NoteCommandWithLua17 = v.InferOutput<
  ReturnType<typeof NoteCommandSchema17>
>;
export type NoteCommand17 = Omit<NoteCommandWithLua17, "luaLine">;
export type Level17Freeze = v.InferOutput<
  ReturnType<typeof LevelFreezeSchema17>
>;
export type Level17Play = v.InferOutput<ReturnType<typeof LevelPlaySchema17>>;
export type Chart17 = v.InferOutput<ReturnType<typeof ChartSchema17>>;

export function convertToPlay17(chart: Chart17, lvIndex: number): Level17Play {
  const levelMin = chart.levelsMeta.at(lvIndex);
  const levelFreeze = chart.levelsFreeze.at(lvIndex);
  return {
    ver: 17,
    offset: chart.offset,
    notes: levelFreeze?.notes || [],
    bpmChanges: levelFreeze?.bpmChanges || [],
    speedChanges: levelFreeze?.speedChanges || [],
    signature: levelFreeze?.signature || [],
    ytBegin: levelMin?.ytBegin || 0,
    ytEndSec: levelMin?.ytEndSec || 0,
  };
}

export type ChartUntil17 = ChartUntil15 | Chart17;
export type ChartUntil17Min = ChartUntil15Min | Chart17;
export async function convertTo17(chart: ChartUntil15): Promise<Chart17> {
  if (chart.ver !== 15 && chart.ver !== 16)
    chart = await convertTo15(chart as ChartUntil14);
  chart satisfies Chart15;
  return {
    ...chart,
    ver: 17,
    levelsFreeze: chart.levelsFreeze.map((l) => ({
      ...l,
      notes: l.notes.map((n) => ({ ...n, longFrom: [] })),
    })),
  };
}
