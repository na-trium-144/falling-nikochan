import { getTimeSec } from "../seq.js";
import { BPMChange1 } from "./chart1.js";
import { Signature5 } from "./chart5.js";
import { Level8Play } from "./chart8.js";
import { DisplayParam7, Note7 } from "./seq7.js";

export interface ChartSeqData8 {
  ver: 8;
  notes: Note7[];
  bpmChanges: BPMChange1[];
  speedChanges: BPMChange1[];
  signature: Signature5[];
  offset: number;
}

/**
 * chartを読み込む
 */
export function loadChart8(level: Level8Play): ChartSeqData8 {
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

    let uAppear: number;
    if (c.fall) {
      // dy/du = 0 or y(t) = 1.5 or x(t) = 2 or x(t) = -0.5
      const uTop = vy / ay;
      const uAppearY =
        (vy - Math.sqrt(vy * vy + 2 * ay * (targetY - 1.5))) / ay;
      const uAppearX = Math.max((2 - targetX) / vx, (-0.5 - targetX) / vx);
      uAppear = Math.min(uAppearX, isNaN(uAppearY) ? uTop : uAppearY);
    } else {
      // y(t) = -0.5 or x(t) = 2 or x(t) = -0.5
      const uAppearY =
        (vy + Math.sqrt(vy * vy + 2 * ay * (targetY - -0.5))) / ay;
      const uAppearX = Math.max((2 - targetX) / vx, (-0.5 - targetX) / vx);
      uAppear = Math.max(uAppearX, uAppearY);
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

      if ((u <= uAppear && uAppear <= uEnd) || (u <= uAppear && ti === 0)) {
        const tAppear = (uAppear - u) / du;
        appearTimeSec = tBegin - tAppear;
      }
      tBegin = tEnd;
      u = uEnd;
    }
    if (appearTimeSec === null) {
      console.error("speedChanges:", level.speedChanges);
      console.error("hitTimeSec:", hitTimeSec);
      console.error("uAppear:", uAppear);
      throw new Error("Failed to calculate appearTimeSec");
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
    ver: 8,
    offset: level.offset,
    signature: level.signature,
    bpmChanges: level.bpmChanges,
    speedChanges: level.speedChanges,
    notes,
  };
}
