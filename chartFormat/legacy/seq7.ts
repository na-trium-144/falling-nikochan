import { getTimeSec, Pos } from "../seq.js";
import { BPMChange1 } from "./chart1.js";
import { Signature5 } from "./chart5.js";
import { Chart7 } from "./chart7.js";

export interface ChartSeqData7 {
  ver: 7;
  notes: Note7[];
  bpmChanges: BPMChange1[];
  signature: Signature5[];
  offset: number;
}

/**
 * ゲーム中で使用する音符の管理
 * id: 通し番号
 * hitTimeSec: 判定時刻
 * appearTimeSec: 画面に表示し始める時刻
 * display: 現在時刻→画面上の位置
 * done: 判定結果 0:まだ 1:Good 2:OK 3:bad 4:miss
 */
export interface Note7 {
  ver: 7;
  id: number;
  big: boolean;
  bigDone: boolean;
  hitTimeSec: number;
  appearTimeSec: number;
  targetX: number;
  vx: number;
  vy: number;
  ay: number;
  display: DisplayParam7[];
  hitPos?: Pos;
  done: number;
  baseScore?: number;
  chainBonus?: number;
  bigBonus?: number;
  chain?: number;
}
interface DisplayParam7 {
  // 時刻(判定時刻 - 秒数)
  timeSecBefore: number;
  // u = u0 + du t
  u0: number;
  du: number;
}

/**
 * 画面上でその瞬間に表示する音符の管理
 * (画面の状態をstateにするため)
 * 時刻の情報を持たない
 */
export interface DisplayNote7 {
  id: number;
  pos: Pos;
  done: number;
  bigDone: boolean;
  baseScore?: number;
  chainBonus?: number;
  bigBonus?: number;
  chain?: number;
}

/**
 * chartを読み込む
 */
export function loadChart7(chart: Chart7, levelIndex: number): ChartSeqData7 {
  const notes: Note7[] = [];
  const level = chart.levels.at(levelIndex);
  if (!level) {
    return {
      ver: 7,
      notes: [],
      bpmChanges: [],
      signature: [],
      offset: chart.offset,
    };
  }
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
    ver: 7,
    offset: chart.offset,
    signature: level.signature,
    bpmChanges: level.bpmChanges,
    notes,
  };
}
export function displayNote7(
  note: Note7,
  timeSec: number
): DisplayNote7 | null {
  if (timeSec - note.hitTimeSec > 0.5) {
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
    const { u0, du } = dispParam;
    const t = note.hitTimeSec - dispParam.timeSecBefore - timeSec;
    const u = u0 + du * t;
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
