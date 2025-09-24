import * as v from "valibot";
import { HashSchema } from "./chart.js";

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

export const RecordPostSchema = () =>
  v.object({
    lvHash: HashSchema(),
    auto: v.boolean(),
    score: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
    fc: v.boolean(),
    fb: v.boolean(),
    editing: v.optional(v.boolean()),
    // adjust the weight of the record. reduce if one player has too many records in a short time.
    factor: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1))),
  });
export type RecordPost = v.InferOutput<ReturnType<typeof RecordPostSchema>>;
