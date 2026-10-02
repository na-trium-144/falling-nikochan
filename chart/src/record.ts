import * as v from "valibot";
import { ChartBrief, HashSchema } from "./chart.js";
import { bigScoreRate, chainScoreRate } from "./gameConstant.js";

// GET /api/record -> RecordGetSummary[]
export const RecordGetSummarySchema = () =>
  v.object({
    lvHash: HashSchema(),
    countAuto: v.pipe(
      v.number(),
      v.description(
        "The total number of autoplay record weighted by each record's `factor`"
      )
    ),
    count: v.pipe(
      v.number(),
      v.description(
        "The total number of non-autoplay record weighted by each record's `factor`"
      )
    ),
    countFC: v.number(),
    countFB: v.number(),
    histogram: v.array(v.number()), // number[13]
  });
export type RecordGetSummary = v.InferOutput<
  ReturnType<typeof RecordGetSummarySchema>
>;

export const RecordPostSchema = () =>
  v.pipe(
    v.object({
      lvHash: HashSchema(),
      auto: v.boolean(),
      score: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
      baseScore: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(80))),
      chainScore: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(20))),
      bigScore: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(20))),
      fc: v.boolean(),
      fb: v.boolean(),
      editing: v.optional(v.boolean()),
      factor: v.optional(
        v.pipe(
          v.number(),
          v.minValue(0),
          v.maxValue(1),
          v.description(
            "adjust the weight of the record. reduce if one player has too many records in a short time."
          )
        )
      ),
      date: v.pipe(v.number(), v.integer(), v.minValue(0)),
    }),
    v.check((record) => {
      if (
        record.baseScore === undefined &&
        record.chainScore === undefined &&
        record.bigScore === undefined
      ) {
        return true;
      } else if (
        record.baseScore !== undefined &&
        record.chainScore !== undefined &&
        record.bigScore !== undefined
      ) {
        return (
          Math.abs(
            record.score -
              record.baseScore -
              record.chainScore -
              record.bigScore
          ) <=
          Number.EPSILON * record.score * 4
        );
      } else {
        return false;
      }
    }, "score !== base + chain + big")
  );
export type RecordPost = v.InferOutput<ReturnType<typeof RecordPostSchema>>;

export function createRecordPost(
  date: Date,
  level: ChartBrief["levels"][number],
  baseScore: number,
  chainScore: number,
  bigScore: number,
  score: number,
  // judgeCount: [number, number, number, number],
  // bigCount: number | null,
  // hitType: number | null,
  // playbackRate: number,
  // cid: string,
  auto: boolean,
  editing: boolean,
  factor: number
) {
  return {
    lvHash: level.hash,
    auto,
    score,
    baseScore,
    chainScore,
    bigScore,
    fc: chainScore === chainScoreRate,
    fb: bigScore === bigScoreRate,
    editing,
    factor,
    date: date.getTime(),
  } satisfies RecordPost;
}
