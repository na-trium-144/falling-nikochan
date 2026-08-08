// 明示的な型の区別のためのver変更のみ

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
  NoteCommandSchema15,
  SignatureSchema15,
  SpeedChangeSchema15,
  YTBeginSchema15,
  YTEndSecSchema15,
} from "./chart15.js";
import { docRefs, Schema } from "../docSchema.js";
import { resolver } from "hono-openapi";
import { ArrayDoc, ArrayOrEmptyObj, ArrayOrEmptyObjDoc } from "../chart.js";
import { ChartUntil13 } from "./chart13.js";

export const LevelPlaySchema17 = () =>
  v.object({
    ver: v.union([v.literal(17)]),
    offset: v.pipe(v.number(), v.minValue(0)),
    notes: v.array(NoteCommandSchema15()),
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
      notes: ArrayDoc(docRefs("NoteCommand15")),
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
export async function Chart17Doc(): Promise<Schema> {
  const schema = (await resolver(ChartSchema17()).toOpenAPISchema()).schema;
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

export type Level17Play = v.InferOutput<ReturnType<typeof LevelPlaySchema17>>;
export type Chart17 = v.InferOutput<ReturnType<typeof ChartSchema17>>;
export type ChartUntil17 = ChartUntil15 | Chart17;
export type ChartUntil17Min = ChartUntil15Min | Chart17;
export async function convertTo17(chart: ChartUntil15): Promise<Chart17> {
  if (chart.ver !== 15 && chart.ver !== 16)
    chart = await convertTo15(chart as ChartUntil13);
  chart satisfies Chart15;
  return { ...chart, ver: 17 };
}
