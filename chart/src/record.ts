import * as v from "valibot";
import { HashSchema } from "./chart.js";
import { ResultSerializedSchema } from "./resultParams.js";

// GET /api/record -> RecordGetSummary[]
export const RecordGetSummarySchema = () =>
  v.object({
    lvHash: HashSchema(),
    countAuto: v.number(),
    // excluding auto play:
    count: v.number(),
    countFC: v.number(),
    countFB: v.number(),
    histogram: v.array(v.number()), // number[13]
  });
export type RecordGetSummary = v.InferOutput<
  ReturnType<typeof RecordGetSummarySchema>
>;

// POST /api/record/:cid
export const RecordPostSchema = () =>
  v.pipe(
    v.object({
      result: ResultSerializedSchema(),
      sign: v.string(),
      lvHash: HashSchema(),
      editing: v.optional(v.boolean()),
      // adjust the weight of the record. reduce if one player has too many records in a short time.
      factor: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1))),
    }),
    v.check((body) => {
      const res = body.result;
      const baseScore100 = res[5];
      const chainScore100 = res[6];
      const bigScore100 = res[7];
      const score100 = res[8];
      return score100 === baseScore100 + chainScore100 + bigScore100;
    }, "score !== base + chain + big")
  );
export type RecordPost = v.InferOutput<ReturnType<typeof RecordPostSchema>>;

export const RecordPostResponseSchema = () =>
  v.object({
    sign: v.nullable(v.string()),
  });
export type RecordPostResponse = v.InferOutput<
  ReturnType<typeof RecordPostResponseSchema>
>;
