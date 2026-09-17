import * as v from "valibot";
import {
  Chart15,
  ChartUntil15,
  ChartUntil15Min,
  convertTo15,
  CopyBufferSchema,
  LevelFreezeSchema15,
  LevelMetaSchema15,
  OffsetSchema15,
} from "./chart15.js";
import { docRefs, Schema } from "../docSchema.js";
import { resolver } from "hono-openapi";
import { ArrayOrEmptyObj, ArrayOrEmptyObjDoc } from "../chart.js";
import { ChartUntil13 } from "./chart13.js";

export const ChartSchema17 = () =>
  v.pipe(
    v.object({
      falling: v.literal("nikochan"),
      ver: v.union([v.literal(17)]),
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
      levelsFreeze: ArrayOrEmptyObj(LevelFreezeSchema15()),
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
export async function Chart17Doc(): Promise<Schema> {
  const schema = (await resolver(ChartSchema17()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      offset: docRefs("Offset15"),
      copyBuffer: docRefs("CopyBuffer"),
      levelsMeta: ArrayOrEmptyObjDoc(docRefs("LevelMeta15")),
      levelsFreeze: ArrayOrEmptyObjDoc(docRefs("LevelFreeze15")),
    },
  };
}

export type Chart17 = v.InferOutput<ReturnType<typeof ChartSchema17>>;
export type ChartUntil17 = ChartUntil15 | Chart17;
export type ChartUntil17Min = ChartUntil15Min | Chart17;
export async function convertTo17(chart: ChartUntil15): Promise<Chart17> {
  if (chart.ver !== 15 && chart.ver !== 16)
    chart = await convertTo15(chart as ChartUntil13);
  chart satisfies Chart15;
  return { ...chart, ver: 17 };
}
