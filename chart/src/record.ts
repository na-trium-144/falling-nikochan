import * as v from "valibot";
import { HashSchema } from "./chart.js";

// GET /api/record -> RecordGetSummary[]
export interface RecordGetSummary {
  lvHash: string;
  count: number;
  // todo: scoreの統計
}

export const RecordPostSchema = () =>
  v.object({
    lvHash: HashSchema(),
    score: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
    fc: v.boolean(),
    fb: v.boolean(),
  });
export type RecordPost = v.InferOutput<ReturnType<typeof RecordPostSchema>>;
