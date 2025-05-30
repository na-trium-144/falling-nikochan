import * as v from "valibot";
import { HashSchema } from "./chart.js";

// GET /api/record -> RecordGetSummary[]
export interface RecordGetSummary {
  lvHash: string;
  countAuto: number;
  // excluding auto play:
  count: number;
  countFC: number;
  countFB: number;
  histogram: number[]; // number[13]
}

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
