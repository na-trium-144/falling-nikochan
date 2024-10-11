import {
  baseScoreRate,
  bonusMax,
  chainScoreRate,
  goodSec,
  okBaseScore,
  okSec,
} from "@/common/gameConstant";
import { Level } from "./chart";
import { getTimeSec } from "./seq";

/*
  lv(難易度の数値) と NPS(1秒あたりに叩ける音符数) の対応は
  npsToLv(), lvToNps() の通り。

  n本の手を持つagent(仮想的なプレイヤー)が、
  最大targetNPS(回/s)の速さで音符を叩いた場合のスコアを計算する
    → agentsPlay(level, type, notesHitSec, targetNPS)
  ただし n=1(type=Single), n=2(type=Double), n=4(それ以外)
  大音符は考慮していない

  agentsのスコアが80以上となるときのlvをclv,
  99以上となるときのlvをplvとおいて、
  難易度= min(clv+2, (clv+plv)/2) としている → difficulty()
  
  ただし上限はを設けないと高密度な譜面で無限に時間がかかるので、
  上限は20 (適当)
*/

function npsToLv(nps: number, type: string) {
  switch (type) {
    case "Single":
      return Math.log(nps) * 5 - 2;
    case "Double":
      return Math.log(nps * 2) * 5 - 2;
    default:
      return Math.log(nps * 4) * 5 - 2;
  }
}
function lvToNps(lv: number, type: string) {
  switch (type) {
    case "Single":
      return Math.exp((lv + 2) / 5);
    case "Double":
      return Math.exp((lv + 2) / 5) / 2;
    default:
      return Math.exp((lv + 2) / 5) / 4;
  }
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
  let clv: number | null = null;
  let plv: number | null = null;
  let averageNPS = Math.max(
    1,
    level.notes.length / Math.max(1, notesHitSec.at(-1) || 0)
  );
  switch (type) {
    case "Single":
      averageNPS /= 1;
      break;
    case "Double":
      averageNPS /= 2;
      break;
    default:
      averageNPS /= 4;
      break;
  }

  for (let lv = Math.floor(npsToLv(averageNPS, type)); ; lv += 0.5) {
    if (clv === null && lv >= maxLv) {
      return maxLv;
    }
    const agentScore = agentsPlay(level, type, notesHitSec, lvToNps(lv, type));
    if (agentScore >= 80 && clv === null) {
      clv = lv;
    }
    if (agentScore >= 99 && plv === null) {
      plv = lv;
    }
    console.log(lv, lvToNps(lv, type), agentScore);
    if (clv !== null && plv !== null) {
      return Math.max(Math.min(Math.round((clv + plv) / 2), maxLv), minLv);
    }
    if (clv !== null && lv >= clv + 4) {
      return Math.max(Math.min(Math.round(clv + 2), maxLv), minLv);
    }
  }
}

function agentsPlay(
  level: Level,
  type: string,
  notesHitSec: number[],
  targetNPS: number
): number {
  const interval = 1 / targetNPS;
  const agentsHitSec =
    type === "Single"
      ? [-Infinity]
      : type === "Double"
      ? [-Infinity, -Infinity]
      : [-Infinity, -Infinity, -Infinity, -Infinity];
  const judgeCount = [0, 0];
  let bonus = 0;
  let chain = 0;
  for (let ni = 0; ni < level.notes.length; ni++) {
    const hitSec = notesHitSec[ni];
    let agentHit: number | null = null;
    let agentJudgeGood = false;
    let agentSec: number | null = null;
    for (let ai = 0; ai < agentsHitSec.length; ai++) {
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
