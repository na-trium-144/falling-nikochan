import * as v from "valibot";
import {
  BPMChangeSchema15,
  Chart15,
  ChartUntil15,
  ChartUntil15Min,
  convertTo15,
  CopyBufferSchema,
  LevelFreezeSchema15,
  LevelMetaSchema15,
  OffsetSchema15,
  RestSchema15,
  SignatureSchema15,
  SpeedChangeSchema15,
} from "./chart15.js";
import { docRefs, Schema } from "../docSchema.js";
import { resolver } from "hono-openapi";
import { ArrayOrEmptyObj, ArrayOrEmptyObjDoc, LuaLineSchema } from "../chart.js";
import { ChartUntil13 } from "./chart13.js";
import { StepSchema } from "../step.js";
import { Chart17, ChartUntil17, ChartUntil17Min, convertTo17 } from "./chart17.js";

export const NoteCommandSchema19 = () =>
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
export async function NoteCommand19Doc(): Promise<Schema> {
  const schema = (await resolver(NoteCommandSchema19()).toOpenAPISchema())
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

export const LevelFreezeSchema19 = () =>
  v.object({
    notes: ArrayOrEmptyObj(NoteCommandSchema19()),
    rest: ArrayOrEmptyObj(RestSchema15()),
    bpmChanges: ArrayOrEmptyObj(BPMChangeSchema15()),
    speedChanges: ArrayOrEmptyObj(SpeedChangeSchema15()),
    signature: ArrayOrEmptyObj(SignatureSchema15()),
  });
export async function LevelFreeze19Doc(): Promise<Schema> {
  const schema = (await resolver(LevelFreezeSchema19()).toOpenAPISchema())
    .schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      notes: ArrayOrEmptyObjDoc(docRefs("NoteCommand19")),
      rest: ArrayOrEmptyObjDoc(docRefs("Rest15")),
      bpmChanges: ArrayOrEmptyObjDoc(docRefs("BPMChange15")),
      speedChanges: ArrayOrEmptyObjDoc(docRefs("SpeedChange15")),
      signature: ArrayOrEmptyObjDoc(docRefs("Signature15")),
    },
  };
}
export const ChartSchema19 = () =>
  v.pipe(
    v.object({
      falling: v.literal("nikochan"),
      ver: v.union([v.literal(19)]),
      offset: OffsetSchema15(),
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
      levelsFreeze: ArrayOrEmptyObj(LevelFreezeSchema19()),
      changePasswd: v.pipe(
        v.optional(
          v.nullable(
            v.pipe(v.string(), v.nonEmpty("Passwd must not be empty"))
          ),
          null
        ),
        v.description(
          "When this field is not null on POST/PUT request, " +
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
export async function Chart19Doc(): Promise<Schema> {
  const schema = (await resolver(ChartSchema19()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      offset: docRefs("Offset15"),
      copyBuffer: docRefs("CopyBuffer"),
      levelsMeta: ArrayOrEmptyObjDoc(docRefs("LevelMeta15")),
      levelsFreeze: ArrayOrEmptyObjDoc(docRefs("LevelFreeze19")),
    },
  };
}

export type NoteCommandWithLua19 = v.InferOutput<
  ReturnType<typeof NoteCommandSchema19>
>;
export type NoteCommand19 = Omit<NoteCommandWithLua19, "luaLine">;
export type Level19Freeze = v.InferOutput<
  ReturnType<typeof LevelFreezeSchema19>
>;
export type Chart19 = v.InferOutput<ReturnType<typeof ChartSchema19>>;

export type ChartUntil19 = ChartUntil17 | Chart19;
export type ChartUntil19Min = ChartUntil17Min | Chart19;
export async function convertTo19(chart: ChartUntil17): Promise<Chart19> {
  if (chart.ver !== 17 && chart.ver !== 18)
    chart = await convertTo17(chart as ChartUntil15);
  chart satisfies Chart17;
  return {
    ...chart,
    ver: 19,
    levelsFreeze: chart.levelsFreeze.map((l) => ({
      ...l,
      notes: l.notes.map((n) => ({ ...n, longFrom: [] })),
    })),
  };
}
