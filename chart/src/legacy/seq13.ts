import { getTimeSec, Pos } from "../seq.js";
import { BPMChange1 } from "./chart1.js";
import { Level13Play, SpeedChange13 } from "./chart13.js";
import { Signature5 } from "./chart5.js";
import { DisplayNote7 } from "./seq7.js";

export interface ChartSeqData13 {
  ver: 13;
  notes: Note13[];
  bpmChanges: BPMChange1[];
  speedChanges: SpeedChange13[];
  signature: Signature5[];
  offset: number;
  ytBegin: number;
  ytEndSec: number;
}
export interface DisplayParam13 {
  // 時刻(判定時刻 - 秒数)
  timeSecBefore: number;
  // u = u0 + du t + ddu t^2 / 2
  u0: number;
  du: number;
  ddu: number;
}
export interface Note13 {
  ver: 13;
  id: number;
  big: boolean;
  bigDone: boolean;
  hitTimeSec: number;
  appearTimeSec: number;
  targetX: number;
  vx: number;
  vy: number;
  ay: number;
  display: DisplayParam13[];
  hitPos?: Pos;
  done: number;
  baseScore?: number;
  chainBonus?: number;
  bigBonus?: number;
  chain?: number;
}

/**
 * chartを読み込む
 */
export function loadChart13(level: Level13Play): ChartSeqData13 {
  const notes: Note13[] = [];
  for (let id = 0; id < level.notes.length; id++) {
    const c = level.notes[id];

    // hitの時刻
    const hitTimeSec: number = getTimeSec(level.bpmChanges, c.step);

    const display: DisplayParam13[] = [];
    let tBegin = hitTimeSec;
    // noteCommandの座標系 (-5<=x<=5) から
    //  displayの座標系に変換するのもここでやる
    const targetX = (c.hitX + 5) / 10;
    const targetY = 0;
    const vx = c.hitVX / 4;
    const vy = c.hitVY / 4;
    const ay = 1 / 4;
    let u = 0;
    // u(t) = ∫t→tBegin, dt * speed(t) / 120
    // x(t) = targetX + vx * u(t)
    // y(t) = targetY + vy * u(t) - (ay * u(t)^2) / 2

    let uRangeMin: number, uRangeMax: number;
    if (c.fall) {
      // max: dy/du = 0 or y(t) = 1.5 or x(t) = 2 or x(t) = -0.5
      // min: y(t) = -0.5 or x(t) = 2 or x(t) = -0.5
      const uTop = vy / ay;
      let uMaxY: number, uMinY: number;
      if (vy === 0) {
        uMaxY = uTop;
        uMinY = uTop;
      } else if (vy > 0) {
        uMaxY = (vy - Math.sqrt(vy * vy + 2 * ay * (targetY - 1.5))) / ay;
        uMinY = (vy - Math.sqrt(vy * vy + 2 * ay * (targetY - -0.5))) / ay;
      } else {
        uMinY = (vy + Math.sqrt(vy * vy + 2 * ay * (targetY - 1.5))) / ay;
        uMaxY = (vy + Math.sqrt(vy * vy + 2 * ay * (targetY - -0.5))) / ay;
      }
      const uMaxX = Math.max((2 - targetX) / vx, (-0.5 - targetX) / vx);
      const uMinX = Math.min((2 - targetX) / vx, (-0.5 - targetX) / vx);
      uRangeMax = Math.min(uMaxX, isNaN(uMaxY) ? uTop : uMaxY);
      uRangeMin = Math.max(uMinX, isNaN(uMinY) ? uTop : uMinY);
    } else {
      // y(t) = -0.5 or x(t) = 2 or x(t) = -0.5
      const uMaxY = (vy + Math.sqrt(vy * vy + 2 * ay * (targetY - -0.5))) / ay;
      const uMinY = (vy - Math.sqrt(vy * vy + 2 * ay * (targetY - -0.5))) / ay;
      const uMaxX = Math.max((2 - targetX) / vx, (-0.5 - targetX) / vx);
      const uMinX = Math.min((2 - targetX) / vx, (-0.5 - targetX) / vx);
      uRangeMax = Math.min(uMaxX, uMaxY);
      uRangeMin = Math.max(uMinX, uMinY);
    }

    let appearTimeSec: number | null = null;
    for (let ti = level.speedChanges.length - 1; ti >= 0; ti--) {
      const ts = level.speedChanges[ti];
      if (ts.timeSec >= hitTimeSec && ti >= 1) {
        continue;
      }
      const tEnd = ts.timeSec;
      // tEnd <= 時刻 <= tBegin の間、
      //  t = tBegin - 時刻  > 0
      //  u = u(tBegin) + du * t
      let du: number;
      let ddu: number;
      const tsNext = level.speedChanges.at(ti + 1);
      if (tsNext?.interp && tBegin !== tEnd) {
        let nextBpm = tsNext.bpm;
        if (tBegin < tsNext.timeSec) {
          nextBpm =
            ts.bpm +
            ((tsNext.bpm - ts.bpm) / (tsNext.timeSec - tEnd)) * (tBegin - tEnd);
        }
        du = nextBpm / 120;
        ddu = (ts.bpm - nextBpm) / 120 / (tBegin - tEnd);
      } else {
        du = ts.bpm / 120;
        ddu = 0;
      }
      display.push({
        timeSecBefore: hitTimeSec - tBegin,
        u0: u,
        du: du,
        ddu: ddu,
      });

      const uEnd =
        u +
        du * (tBegin - tEnd) +
        (ddu * (tBegin - tEnd) * (tBegin - tEnd)) / 2;

      if (
        (u <= uRangeMax && uRangeMax <= uEnd) ||
        (u <= uRangeMax && ti === 0 && du > 0)
      ) {
        const tAppear = (uRangeMax - u) / du;
        appearTimeSec = tBegin - tAppear;
      } else if (
        (u >= uRangeMin && uRangeMin >= uEnd) ||
        (u >= uRangeMin && ti === 0 && du < 0)
      ) {
        const tAppear = (uRangeMin - u) / du;
        appearTimeSec = tBegin - tAppear;
      }
      tBegin = tEnd;
      u = uEnd;
    }
    // 判定時刻が速度変化中の場合に判定を過ぎた後の速度を安定化する
    display.unshift({
      timeSecBefore: 0,
      u0: display[0].u0,
      du: display[0].du,
      ddu: 0,
    });
    if (appearTimeSec === null) {
      // Speed=0から譜面が始まる場合
      appearTimeSec = -Infinity;
    }
    notes.push({
      ver: 13,
      id,
      big: c.big,
      hitTimeSec,
      appearTimeSec,
      done: 0,
      bigDone: false,
      display,
      targetX,
      vx,
      vy,
      ay,
    });
  }
  return {
    ver: 13,
    offset: level.offset,
    signature: level.signature,
    bpmChanges: level.bpmChanges,
    speedChanges: level.speedChanges,
    notes,
    ytBegin: level.ytBegin,
    ytEndSec: level.ytEndSec,
  };
}

export function displayNote13(
  note: Note13,
  timeSec: number
): DisplayNote7 | null {
  if (timeSec - note.hitTimeSec > 1.0) {
    return null;
  } else if (note.done >= 1 && note.done <= 3) {
    return {
      id: note.id,
      pos: note.hitPos || { x: -1, y: -1 },
      done: note.done,
      bigDone: note.bigDone,
      chain: note.chain,
      baseScore: note.baseScore,
      chainBonus: note.chainBonus,
      bigBonus: note.bigBonus,
    };
  } else if (timeSec < note.appearTimeSec) {
    return null;
  } else {
    let di = 0;
    for (; di + 1 < note.display.length; di++) {
      if (timeSec > note.hitTimeSec - note.display[di + 1].timeSecBefore) {
        break;
      }
    }
    const dispParam = note.display[di];
    const { u0, du, ddu } = dispParam;
    const t = note.hitTimeSec - dispParam.timeSecBefore - timeSec;
    const u = u0 + du * t + (ddu * t * t) / 2;
    return {
      id: note.id,
      pos: {
        x: note.targetX + note.vx * u,
        y: note.vy * u - (note.ay * u * u) / 2,
      },
      done: note.done,
      bigDone: note.bigDone,
      chain: note.chain,
      baseScore: note.baseScore,
      chainBonus: note.chainBonus,
      bigBonus: note.bigBonus,
    };
  }
}
