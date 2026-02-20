import { OpenAPIV3_1 } from "openapi-types";
import {
  Chart15Doc,
  CopyBufferDoc,
  CopyBufferEntrySchema,
  LevelFreeze15Doc,
  LevelMetaSchema15,
  NoteCommand15Doc,
  Rest15Doc,
} from "./legacy/chart15.js";
import { EmptyObj, LuaLineSchema } from "./chart.js";
import { StepSchema } from "./step.js";
import { resolver } from "hono-openapi";

export type Schema = OpenAPIV3_1.SchemaObject;
export type Reference = OpenAPIV3_1.ReferenceObject;

export const docSchemas = async () => ({
  Chart15: await Chart15Doc(),
  LevelMeta15: (await resolver(LevelMetaSchema15()).toOpenAPISchema()).schema,
  LevelFreeze15: await LevelFreeze15Doc(),
  EmptyObj: (await resolver(EmptyObj()).toOpenAPISchema()).schema,
  Step: (await resolver(StepSchema()).toOpenAPISchema()).schema,
  LuaLine: (await resolver(LuaLineSchema()).toOpenAPISchema()).schema,
  NoteCommand15: await NoteCommand15Doc(),
  Rest15: await Rest15Doc(),
  CopyBufferEntry: (await resolver(CopyBufferEntrySchema()).toOpenAPISchema())
    .schema,
  CopyBuffer: await CopyBufferDoc(),
});

export const docRefs = (
  name: keyof Awaited<ReturnType<typeof docSchemas>>
) => ({
  $ref: `#/components/schemas/${name}`,
});
