import {
  levelTypes,
  ResultParams,
  serializeResultParamsLegacy,
} from "@falling-nikochan/chart";
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
type ResultData = v.InferOutput<ReturnType<typeof ResultDataSchema>>;

function toResultParams(
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
    cid: null,
  };
}

export function getBestScore(
  cid: string,
  level: {
    hash: string;
    name: string;
    type: string;
    difficulty: number;
  }
): { result: string; sign?: string } | null {
  try {
    return v.parse(
      v.nullable(
        v.object({ result: v.string(), sign: v.optional(v.string()) })
      ),
      JSON.parse(localStorage.getItem(bestKey(cid, level.hash)) || "null")
    );
  } catch (e) {
    console.error(
      `Error parsing ${bestKey(cid, level.hash)}:`,
      v.isValiError(e) ? v.flatten(e.issues) : e
    );
  }
  // load and convert legacy save data to ResultParams
  let bestScore: ResultData | null = null;
  try {
    bestScore = v.parse(
      v.nullable(ResultDataSchema()),
      JSON.parse(localStorage.getItem(bestKey(cid, level.hash)) || "null")
    );
  } catch (e) {
    console.error(
      `Error parsing ${bestKey(cid, level.hash)}:`,
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
        if (oldScore && oldScore.levelHash === level.hash) {
          bestScore = {
            baseScore: oldScore.baseScore,
            chainScore: oldScore.chainScore,
            bigScore: oldScore.bigScore,
            judgeCount: oldScore.judgeCount,
          };
          // localStorage.setItem(bestKey(cid, level.hash), JSON.stringify(bestScore));
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
  if (bestScore) {
    const result = serializeResultParamsLegacy(
      toResultParams(bestScore, level)
    );
    localStorage.setItem(bestKey(cid, level.hash), JSON.stringify({ result }));
    return { result };
  } else {
    return bestScore satisfies null;
  }
}
export function setBestScore(
  cid: string,
  lvHash: string,
  result: string,
  sign: string
) {
  localStorage.setItem(bestKey(cid, lvHash), JSON.stringify({ result, sign }));
}
export function clearBestScore(cid: string, lvHash: string) {
  localStorage.removeItem(bestKey(cid, lvHash));
}
