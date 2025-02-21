import {
  baseScoreRate,
  bonusMax,
  chainScoreRate,
  goodSec,
  okBaseScore,
  okSec,
} from "./gameConstant.js";
import { Level } from "./chart.js";
import { getTimeSec } from "./seq.js";

/*
  lv(難易度の数値) と NPS(1秒あたりに叩ける音符数) の対応は
  npsToLv(), lvToNps() の通り。

  n本の手を持つagent(仮想的なプレイヤー)が、
  最大targetNPS(回/s)の速さで音符を叩いた場合のスコアを計算する
    → agentsPlay(level, n, notesHitSec, targetNPS)
  ただし n=1(type=Single), n=2(type=Double)
  大音符は考慮していない

  type=Maniac の場合、 n=4の計算結果 + 0, n=5の計算結果 + 1, ... の中で最小のものを採用する

  agentsのスコアが80以上となるときのlvをclv,
  99以上となるときのlvをplvとおいて、
  難易度= min(clv+2, (clv+plv)/2) としている → difficulty()
  
  ただし上限を設けないと高密度な譜面で無限に時間がかかるので、
  上限は20 (適当)
*/

function npsToLv(nps: number, multiHit: number) {
  return Math.log(nps * multiHit) * 5 - 2;
}
function lvToNps(lv: number, multiHit: number) {
  return Math.exp((lv + 2) / 5) / multiHit;
}

export function difficulty(level: Level, type: string): number {
  const maxLv = 20;
  const minLv = 1;
  if (level.notes.length === 0) {
    return minLv;
  }

  const notesHitSec = level.notes.map((n) =>
    getTimeSec(level.bpmChanges, n.step)
  );
  let alv: number | null = null;
  let averageNPS = Math.max(
    1,
    level.notes.length / Math.max(1, notesHitSec.at(-1) || 0)
  );
  let baseHit: number;
  switch (type) {
    case "Single":
      baseHit = 1;
      break;
    case "Double":
      baseHit = 2;
      break;
    default:
      baseHit = 4;
      break;
  }

  for (
    let additionalHit = 0;
    alv === null || additionalHit < alv;
    additionalHit++
  ) {
    const multiHit = baseHit + additionalHit;
    let clv: number | null = null;
    let plv: number | null = null;
    for (
      let lv = Math.floor(npsToLv(averageNPS / multiHit, multiHit));
      ;
      lv += 0.5
    ) {
      if (clv === null && lv >= maxLv) {
        alv = alv || maxLv;
        break;
      }
      const agentScore = agentsPlay(
        level,
        multiHit,
        notesHitSec,
        lvToNps(lv, multiHit)
      );
      if (agentScore >= 80 && clv === null) {
        clv = lv;
      }
      if (agentScore >= 99 && plv === null) {
        plv = lv;
      }
      if (clv !== null && plv !== null) {
        alv = Math.max(
          Math.min(Math.round((clv + plv) / 2) + additionalHit, alv || maxLv),
          minLv
        );
        break;
      }
      if (clv !== null && lv >= clv + 4) {
        alv = Math.max(
          Math.min(Math.round(clv + 2) + additionalHit, alv || maxLv),
          minLv
        );
        break;
      }
    }
    if (type === "Single" || type === "Double") {
      break;
    }
  }
  return alv;
}

function agentsPlay(
  level: Level,
  multiHit: number,
  notesHitSec: number[],
  targetNPS: number
): number {
  const interval = 1 / targetNPS;
  const agentsHitSec: number[] = new Array(multiHit).fill(-Infinity);
  const judgeCount = [0, 0];
  let bonus = 0;
  let chain = 0;
  for (let ni = 0; ni < level.notes.length; ni++) {
    const hitSec = notesHitSec[ni];
    let agentHit: number | null = null;
    let agentJudgeGood = false;
    let agentSec: number | null = null;
    for (let ai = 0; ai < multiHit; ai++) {
      if (hitSec + goodSec >= agentsHitSec[ai] + interval) {
        agentHit = ai;
        agentJudgeGood = true;
        agentSec = Math.max(hitSec, agentsHitSec[ai] + interval);
        break;
      } else if (hitSec + okSec >= agentsHitSec[ai] + interval) {
        agentHit = ai;
        agentSec = agentsHitSec[ai] + interval;
      }
      // badSec内で叩けるかどうかをチェックする必要はあるか?
    }
    if (agentHit !== null && agentSec !== null) {
      agentsHitSec[agentHit] = agentSec;
      judgeCount[agentJudgeGood ? 0 : 1]++;
      chain++;
      bonus += Math.min(chain, bonusMax);
    } else {
      chain = 0;
    }
  }
  const notesTotal = level.notes.length;
  const bonusTotal =
    notesTotal < bonusMax
      ? (notesTotal * (notesTotal + 1)) / 2
      : (bonusMax * (bonusMax + 1)) / 2 + bonusMax * (notesTotal - bonusMax);
  return (
    ((judgeCount[0] + judgeCount[1] * okBaseScore) / notesTotal) *
      baseScoreRate +
    (bonus / bonusTotal) * chainScoreRate
  );
}
