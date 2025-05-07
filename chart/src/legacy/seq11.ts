import { getTimeSec } from "../seq.js";
import { BPMChange1 } from "./chart1.js";
import { Level11Play } from "./chart11.js";
import { Signature5 } from "./chart5.js";
import { DisplayParam7, Note7 } from "./seq7.js";

export interface ChartSeqData11 {
  ver: 12;
  notes: Note7[];
  bpmChanges: BPMChange1[];
  speedChanges: BPMChange1[];
  signature: Signature5[];
  offset: number;
  ytBegin: number;
  ytEndSec: number;
}

/**
 * chartを読み込む
 */
export function loadChart11(level: Level11Play): ChartSeqData11 {
  const notes: Note7[] = [];
  for (let id = 0; id < level.notes.length; id++) {
    const c = level.notes[id];

    // hitの時刻
    const hitTimeSec: number = getTimeSec(level.bpmChanges, c.step);

    const display: DisplayParam7[] = [];
    let tBegin = hitTimeSec;
    // noteCommandの座標系 (-5<=x<=5) から
    //  displayの座標系に変換するのもここでやる
    const targetX = (c.hitX + 5) / 10;
    const targetY = 0;
    const vx = c.hitVX / 4;
    const vy = c.hitVY / 4;
    const ay = 1 / 4;
    let u = 0;
    // u(t) = ∫t→tBegin, dt * speed / 120
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
      const du = ts.bpm / 120;
      // tEnd <= 時刻 <= tBegin の間、
      //  t = tBegin - 時刻  > 0
      //  u = u(tBegin) + du * t
      display.push({
        timeSecBefore: hitTimeSec - tBegin,
        u0: u,
        du: du,
      });

      const uEnd = u + du * (tBegin - tEnd);

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
    if (appearTimeSec === null) {
      console.error("Failed to calculate appearTimeSec");
      console.error("speedChanges:", level.speedChanges);
      console.error("hitTimeSec:", hitTimeSec);
      console.error("uRange:", uRangeMin, uRangeMax);
      appearTimeSec = hitTimeSec;
    }
    notes.push({
      ver: 7,
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
    ver: 12,
    offset: level.offset,
    signature: level.signature,
    bpmChanges: level.bpmChanges,
    speedChanges: level.speedChanges,
    notes,
    ytBegin: level.ytBegin,
    ytEndSec: level.ytEndSec,
  };
}
