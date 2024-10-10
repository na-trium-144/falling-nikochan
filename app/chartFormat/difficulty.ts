import {
  baseScoreRate,
  bonusMax,
  chainScoreRate,
  goodSec,
  okBaseScore,
  okSec,
} from "@/play/[cid]/gameLogic";
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

function npsToLv(nps: number) {
  return Math.log(nps) * 5 - 2;
}
function lvToNps(lv: number) {
  return Math.exp((lv + 2) / 5);
}

export function difficulty(level: Level, type: string): number {
  if (level.notes.length === 0) {
    return 0;
  }
  const notesHitSec = level.notes.map((n) =>
    getTimeSec(level.bpmChanges, n.step)
  );
  let clv: number | null = null;
  let plv: number | null = null;
  const averageNPS = level.notes.length / notesHitSec.at(-1)!;

  const maxLv = 20;
  for (let lv = Math.floor(npsToLv(averageNPS)); lv < maxLv; lv += 0.5) {
    const agentScore = agentsPlay(level, type, notesHitSec, lvToNps(lv));
    if (agentScore >= 80 && clv === null) {
      clv = lv;
    }
    if (agentScore >= 99 && plv === null) {
      plv = lv;
    }
    if (clv !== null && plv !== null) {
      return Math.round((clv + plv) / 2);
    }
    if (clv !== null && lv >= clv + 4) {
      return Math.round(clv + 2);
    }
  }
  return maxLv;
}

function agentsPlay(
  level: Level,
  type: string,
  notesHitSec: number[],
  targetNPS: number
): number {
  const interval = 1 / targetNPS;
  const agentsHitSec =
    type === "Single" ? [0] : type === "Double" ? [0, 0] : [0, 0, 0, 0];
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
