import { OpenAPIV3_1 } from "openapi-types";
import {
  BPMChange15Doc,
  Chart15Doc,
  CopyBufferDoc,
  CopyBufferEntrySchema,
  LevelFreeze15Doc,
  LevelMeta15Doc,
  LevelPlay15Doc,
  NoteCommand15Doc,
  Rest15Doc,
  Signature15Doc,
  SpeedChange15Doc,
  YTBeginSchema15,
  YTEndSchema15,
  YTEndSecSchema15,
} from "./legacy/chart15.js";
import { EmptyObj, LuaLineSchema } from "./chart.js";
import { StepSchema } from "./step.js";
import { resolver } from "hono-openapi";
import {
  BPMChangeSeqDoc,
  ChartSeqDataDoc,
  NoteSeqSchema,
  SignatureSeqDoc,
  SpeedChangeSeqDoc,
} from "./seq.js";
import { SignatureBarSchema } from "./signature.js";

export type Schema = OpenAPIV3_1.SchemaObject;
export type Reference = OpenAPIV3_1.ReferenceObject;

export const docSchemas = async () => ({
  Chart15: await Chart15Doc(),
  LevelMeta15: await LevelMeta15Doc(),
  LevelFreeze15: await LevelFreeze15Doc(),
  LevelPlay15: await LevelPlay15Doc(),
  EmptyObj: (await resolver(EmptyObj()).toOpenAPISchema()).schema,
  Step: (await resolver(StepSchema()).toOpenAPISchema()).schema,
  LuaLine: (await resolver(LuaLineSchema()).toOpenAPISchema()).schema,
  NoteCommand15: await NoteCommand15Doc(),
  Rest15: await Rest15Doc(),
  BPMChange15: await BPMChange15Doc(),
  SpeedChange15: await SpeedChange15Doc(),
  SignatureBar: (await resolver(SignatureBarSchema()).toOpenAPISchema()).schema,
  Signature15: await Signature15Doc(),
  YTBegin15: (await resolver(YTBeginSchema15()).toOpenAPISchema()).schema,
  YTEnd15: (await resolver(YTEndSchema15()).toOpenAPISchema()).schema,
  YTEndSec15: (await resolver(YTEndSecSchema15()).toOpenAPISchema()).schema,
  CopyBufferEntry: (await resolver(CopyBufferEntrySchema()).toOpenAPISchema())
    .schema,
  CopyBuffer: await CopyBufferDoc(),
  ChartSeqData: await ChartSeqDataDoc(),
  NoteSeq: (await resolver(NoteSeqSchema()).toOpenAPISchema()).schema,
  BPMChangeSeq: await BPMChangeSeqDoc(),
  SpeedChangeSeq: await SpeedChangeSeqDoc(),
  SignatureSeq: await SignatureSeqDoc(),
});

export const docRefs = (
  name: keyof Awaited<ReturnType<typeof docSchemas>>
) => ({
  $ref: `#/components/schemas/${name}`,
});
