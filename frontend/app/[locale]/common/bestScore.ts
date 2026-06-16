import { levelTypes, ResultParams } from "@falling-nikochan/chart";
import * as v from "valibot";

export function bestKey(cid: string, lvHash: string) {
  return `best-${cid}-${lvHash.slice(0, 8)}`;
}
const ResultDataSchema = () =>
  v.object({
    baseScore: v.number(),
    chainScore: v.number(),
    bigScore: v.number(),
    judgeCount: v.pipe(v.array(v.pipe(v.number(), v.integer())), v.length(4)),
    bigCount: v.optional(v.nullable(v.number())),
    inputType: v.optional(v.nullable(v.number())),
    date: v.optional(v.number()),
    levelHash: v.optional(v.string()),
  });
export type ResultData = v.InferOutput<ReturnType<typeof ResultDataSchema>>;

export function toResultParams(
  data: ResultData,
  level: {
    name: string;
    type: string;
    difficulty: number;
  }
): ResultParams {
  return {
    date: data.date !== undefined ? new Date(data.date) : null,
    lvName: level.name,
    lvType: levelTypes.indexOf(level.type),
    lvDifficulty: level.difficulty,
    baseScore100: Math.round(data.baseScore * 100),
    chainScore100: Math.round(data.chainScore * 100),
    bigScore100: Math.round(data.bigScore * 100),
    score100: Math.round(
      (data.baseScore + data.chainScore + data.bigScore) * 100
    ),
    judgeCount: data.judgeCount as [number, number, number, number],
    bigCount: data.bigCount !== undefined ? data.bigCount : false,
    inputType: data.inputType !== undefined ? data.inputType : null,
    playbackRate4: 4, // x1以外の記録は保存されないので
  };
}

export function getBestScore(cid: string, lvHash: string): ResultData | null {
  let bestScore: ResultData | null = null;
  try {
    bestScore = v.parse(
      v.nullable(ResultDataSchema()),
      JSON.parse(localStorage.getItem(bestKey(cid, lvHash)) || "null")
    );
  } catch (e) {
    console.error(
      `Error parsing ${bestKey(cid, lvHash)}:`,
      v.isValiError(e) ? v.flatten(e.issues) : e
    );
  }
  if (!bestScore) {
    for (let i = 0; i < 10; i++) {
      const oldKey = `best-${cid}-${i}`;
      try {
        const oldScore = v.parse(
          v.nullable(ResultDataSchema()),
          JSON.parse(localStorage.getItem(oldKey) || "null")
        );
        if (oldScore && oldScore.levelHash === lvHash) {
          bestScore = {
            baseScore: oldScore.baseScore,
            chainScore: oldScore.chainScore,
            bigScore: oldScore.bigScore,
            judgeCount: oldScore.judgeCount,
          };
          localStorage.setItem(bestKey(cid, lvHash), JSON.stringify(bestScore));
          localStorage.removeItem(oldKey);
          break;
        }
      } catch (e) {
        console.error(
          `Error parsing ${oldKey}:`,
          v.isValiError(e) ? v.flatten(e.issues) : e
        );
      }
    }
  }
  return bestScore;
}
export function setBestScore(cid: string, lvHash: string, data: ResultData) {
  localStorage.setItem(bestKey(cid, lvHash), JSON.stringify(data));
}
export function clearBestScore(cid: string, lvHash: string) {
  localStorage.removeItem(bestKey(cid, lvHash));
}
