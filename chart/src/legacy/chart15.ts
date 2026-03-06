// levelMin->levelMeta
// copyBuffer仕様変更

import * as v from "valibot";
import {
  ArrayOrEmptyObjDoc,
  ArrayOrEmptyObj,
  levelTypesConst,
  LuaLineSchema,
  ArrayDoc,
} from "../chart.js";
import { ChartUntil13 } from "./chart13.js";
import {
  Chart14Edit,
  ChartUntil14,
  ChartUntil14Min,
  convertTo14,
} from "./chart14.js";
import { resolver } from "hono-openapi";
import { docRefs, Schema } from "../docSchema.js";
import { StepSchema } from "../step.js";
import { SignatureBarSchema } from "../signature.js";

export const NoteCommandSchema15 = () =>
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
    }),
    v.description("A note command described by hit position and velocity.")
  );
export async function NoteCommand15Doc(): Promise<Schema> {
  const schema = (await resolver(NoteCommandSchema15()).toOpenAPISchema())
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
export const RestSchema15 = () =>
  v.pipe(
    v.object({
      begin: StepSchema(),
      duration: StepSchema(),
      luaLine: LuaLineSchema(),
    }),
    v.description(
      "A rest command that specifies a rest period between notes. " +
        "Only used by chart editor for inserting other commands to lua code, and is ignored when playing."
    )
  );
export async function Rest15Doc(): Promise<Schema> {
  const schema = (await resolver(RestSchema15()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      begin: docRefs("Step"),
      duration: docRefs("Step"),
      luaLine: docRefs("LuaLine"),
    },
  };
}
export const BPMChangeSchema15 = () =>
  v.pipe(
    v.object({
      step: StepSchema(),
      bpm: v.pipe(v.number(), v.gtValue(0)),
      luaLine: LuaLineSchema(),
    }),
    v.description("BPM change command.")
  );
export async function BPMChange15Doc(): Promise<Schema> {
  const schema = (await resolver(BPMChangeSchema15()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      step: docRefs("Step"),
      luaLine: docRefs("LuaLine"),
    },
  };
}
export const SpeedChangeSchema15 = () =>
  v.pipe(
    v.object({
      step: StepSchema(),
      bpm: v.number(),
      interp: v.pipe(
        v.boolean(),
        v.description(
          "whether the speed change is gradual between the previous and this speed change command."
        )
      ),
      luaLine: LuaLineSchema(),
    }),
    v.description(
      "Speed change command, where bpm is the speed multiplier. " +
        "0 and negative values can also be used."
    )
  );
export async function SpeedChange15Doc(): Promise<Schema> {
  const schema = (await resolver(SpeedChangeSchema15()).toOpenAPISchema())
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
export const SignatureSchema15 = () =>
  v.pipe(
    v.object({
      step: StepSchema(),
      offset: StepSchema(),
      bars: SignatureBarSchema(),
      luaLine: LuaLineSchema(),
    }),
    v.description(
      "Time signature change command. " +
        "Only beats that can be expressed as the sum of 4th, 8th, and 16th notes are supported. " +
        "If offset is not zero, the count start from the middle of the time signature. " +
        "(step - offset is the time of the first beat of this signature) \n" +
        "This only affects the display of slime-chans at the bottom right of the screen during play, " +
        "and does not affect the timing of notes or other commands."
    )
  );
export async function Signature15Doc(): Promise<Schema> {
  const schema = (await resolver(SignatureSchema15()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      step: docRefs("Step"),
      offset: docRefs("Step"),
      bars: docRefs("SignatureBar"),
      luaLine: docRefs("LuaLine"),
    },
  };
}

export const YTBeginSchema15 = () =>
  v.pipe(
    v.number(),
    v.minValue(0),
    v.description("The time in seconds to start the video")
  );
export const YTEndSchema15 = () =>
  v.pipe(
    v.union([v.literal("note"), v.literal("yt"), v.number()]),
    v.description(
      "The time to end the video. " +
        "'note': the end time is determined by the last note, rest or bpm/speed change command. " +
        "'yt': the end time is determined by ytEndSec. " +
        "a number value: the end time in seconds. " +
        "This is only used by the chart editor and is ignored when playing."
    )
  );
export const YTEndSecSchema15 = () =>
  v.pipe(
    v.number(),
    v.minValue(0),
    v.description("The time in seconds to end the video.")
  );

export const LevelMetaSchema15 = () =>
  v.object({
    name: v.string(),
    type: v.picklist(levelTypesConst),
    unlisted: v.boolean(),
    ytBegin: YTBeginSchema15(),
    ytEnd: YTEndSchema15(),
    ytEndSec: YTEndSecSchema15(),
    snapDivider: v.pipe(
      v.number(),
      v.description("The step unit in chart editor is set to 1/(4*snapDivider)")
    ),
  });
export async function LevelMeta15Doc(): Promise<Schema> {
  const schema = (await resolver(LevelMetaSchema15()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      ytBegin: docRefs("YTBegin15"),
      ytEnd: docRefs("YTEnd15"),
      ytEndSec: docRefs("YTEndSec15"),
    },
  };
}

export const LevelFreezeSchema15 = () =>
  v.object({
    notes: ArrayOrEmptyObj(NoteCommandSchema15()),
    rest: ArrayOrEmptyObj(RestSchema15()),
    bpmChanges: ArrayOrEmptyObj(BPMChangeSchema15()),
    speedChanges: ArrayOrEmptyObj(SpeedChangeSchema15()),
    signature: ArrayOrEmptyObj(SignatureSchema15()),
  });
export async function LevelFreeze15Doc(): Promise<Schema> {
  const schema = (await resolver(LevelFreezeSchema15()).toOpenAPISchema())
    .schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      notes: ArrayOrEmptyObjDoc(docRefs("NoteCommand15")),
      rest: ArrayOrEmptyObjDoc(docRefs("Rest15")),
      bpmChanges: ArrayOrEmptyObjDoc(docRefs("BPMChange15")),
      speedChanges: ArrayOrEmptyObjDoc(docRefs("SpeedChange15")),
      signature: ArrayOrEmptyObjDoc(docRefs("Signature15")),
    },
  };
}

export const LevelPlaySchema15 = () =>
  v.object({
    ver: v.union([v.literal(15)]),
    offset: v.pipe(v.number(), v.minValue(0)),
    notes: v.array(NoteCommandSchema15()),
    bpmChanges: v.array(BPMChangeSchema15()),
    speedChanges: v.array(SpeedChangeSchema15()),
    signature: v.array(SignatureSchema15()),
    ytBegin: YTBeginSchema15(),
    ytEndSec: YTEndSecSchema15(),
  });
export async function LevelPlay15Doc(): Promise<Schema> {
  const schema = (await resolver(LevelPlaySchema15()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      notes: ArrayDoc(docRefs("NoteCommand15")),
      bpmChanges: ArrayDoc(docRefs("BPMChange15")),
      speedChanges: ArrayDoc(docRefs("SpeedChange15")),
      signature: ArrayDoc(docRefs("Signature15")),
      ytBegin: docRefs("YTBegin15"),
      ytEndSec: docRefs("YTEndSec15"),
    },
  };
}

export const CopyBufferEntrySchema = () =>
  v.tuple([
    v.pipe(v.number(), v.description("hitX value")),
    v.pipe(v.number(), v.description("hitVX value")),
    v.pipe(v.number(), v.description("hitVY value")),
    v.pipe(v.boolean(), v.description("big value")),
    v.pipe(v.boolean(), v.description("fall value")),
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
export async function CopyBufferDoc(): Promise<Schema> {
  const schema = (await resolver(CopyBufferSchema()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: Object.fromEntries(
      Array.from(new Array(10), (_, i) => [
        String(i), // 0-9
        docRefs("CopyBufferEntry"),
      ])
    ),
  };
}

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
      levelsFreeze: ArrayOrEmptyObj(LevelFreezeSchema15()),
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
export async function Chart15Doc(): Promise<Schema> {
  const schema = (await resolver(ChartSchema15()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      copyBuffer: docRefs("CopyBuffer"),
      levelsMeta: ArrayOrEmptyObjDoc(docRefs("LevelMeta15")),
      levelsFreeze: ArrayOrEmptyObjDoc(docRefs("LevelFreeze15")),
    },
  };
}

export type YTBegin15 = v.InferOutput<ReturnType<typeof YTBeginSchema15>>;
export type YTEnd15 = v.InferOutput<ReturnType<typeof YTEndSchema15>>;
export type YTEndSec15 = v.InferOutput<ReturnType<typeof YTEndSecSchema15>>;

export type NoteCommandWithLua15 = v.InferOutput<
  ReturnType<typeof NoteCommandSchema15>
>;
export type RestWithLua15 = v.InferOutput<ReturnType<typeof RestSchema15>>;
export type BPMChangeWithLua15 = v.InferOutput<
  ReturnType<typeof BPMChangeSchema15>
>;
export type SpeedChangeWithLua15 = v.InferOutput<
  ReturnType<typeof SpeedChangeSchema15>
>;
export type SignatureWithLua15 = v.InferOutput<
  ReturnType<typeof SignatureSchema15>
>;
export type NoteCommand15 = Omit<NoteCommandWithLua15, "luaLine">;
export type Rest15 = Omit<RestWithLua15, "luaLine">;
export type BPMChange15 = Omit<BPMChangeWithLua15, "luaLine">;
export type SpeedChange15 = Omit<SpeedChangeWithLua15, "luaLine">;
export type Signature15 = Omit<SignatureWithLua15, "luaLine">;

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
