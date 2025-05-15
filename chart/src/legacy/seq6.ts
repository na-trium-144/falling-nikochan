import { getTimeSec, Pos } from "../seq.js";
import { BPMChange1 } from "./chart1.js";
import { Signature5 } from "./chart5.js";
import { Chart6, Level6Play } from "./chart6.js";

export interface ChartSeqData6 {
  ver: 6;
  notes: Note6[];
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
export interface Note6 {
  ver: 6;
  id: number;
  big: boolean;
  bigDone: boolean;
  hitTimeSec: number;
  appearTimeSec: number;
  targetX: number;
  hitPos?: Pos;
  done: number;
  baseScore?: number;
  chainBonus?: number;
  bigBonus?: number;
  chain?: number;
  display: DisplayParam6[];
}
interface DisplayParam6 {
  // 時刻(判定時刻 - 秒数)
  timeSecBefore: number;
  // x = a0 + a1 t, y = b0 + b1 t + b2 t^2
  a: [number, number];
  b: [number, number, number];
}

/**
 * 画面上でその瞬間に表示する音符の管理
 * (画面の状態をstateにするため)
 * 時刻の情報を持たない
 */
export interface DisplayNote6 {
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
export function loadChart6(
  chart: Level6Play | Chart6,
  levelIndex?: number
): ChartSeqData6 {
  const notes: Note6[] = [];
  let level: Level6Play | undefined;
  if (chart && "levels" in chart && levelIndex && chart.levels.at(levelIndex)) {
    level = { ...chart.levels.at(levelIndex)!, ver: 6, offset: chart.offset };
  } else {
    level = chart as Level6Play;
  }
  if (!level) {
    return {
      ver: 6,
      notes: [],
      bpmChanges: [],
      signature: [],
      offset: 0,
    };
  }
  for (let id = 0; id < level.notes.length; id++) {
    const c = level.notes[id];

    // hitの時刻
    const hitTimeSec: number = getTimeSec(level.bpmChanges, c.step);

    const display: DisplayParam6[] = [];
    let tBegin = hitTimeSec;
    // noteCommandの座標系 (-5<=x<=5) から
    //  displayの座標系に変換するのもここでやる
    let x = (c.hitX + 5) / 10;
    const targetX = x;
    let y = 0;
    let vx = c.hitVX;
    let vy = c.hitVY;
    const ay = 1;
    let appearTimeSec = hitTimeSec;
    for (let ti = level.speedChanges.length - 1; ti >= 0; ti--) {
      const ts = level.speedChanges[ti];
      if (ts.timeSec >= hitTimeSec && ti >= 1) {
        continue;
      }
      const tEnd = ts.timeSec;

      const vx_ = (vx * ts.bpm) / 4 / 120;
      const vy_ = (vy * ts.bpm) / 4 / 120;
      const ay_ = (ay * ts.bpm * ts.bpm) / 4 / 120 / 120;

      // tEnd <= 時刻 <= tBegin の間、
      //  t = tBegin - 時刻  > 0
      //  x = x(tBegin) + vx * t
      //  y = y(tBegin) + vy * t - (ay * t * t) / 2;
      display.push({
        timeSecBefore: hitTimeSec - tBegin,
        a: [x, vx_],
        b: [y, vy_, -ay_ / 2],
      });

      // tを少しずつ変えながら、x,yが画面内に入っているかをチェック
      for (let t = 0; t < tBegin - tEnd; t += 0.01) {
        const xt = x + vx_ * t;
        const yt = y + vy_ * t - (ay_ * t * t) / 2;
        if (xt >= -0.5 && xt < 1.5 && yt >= -0.5 && yt < 1.5) {
          appearTimeSec = tBegin - t;
        }
      }
      if (ti == 0) {
        // tを少しずつ変えながら、x,yが画面内に入っているかをチェック
        for (let t = 0; t < 999; t += 0.01) {
          const xt = x + vx_ * t;
          const yt = y + vy_ * t - (ay_ * t * t) / 2;
          if (xt >= -0.5 && xt < 1.5 && yt >= -0.5 && yt < 1.5) {
            appearTimeSec = tBegin - t;
          } else {
            break;
          }
        }
      }

      const dt = tBegin - tEnd;
      x += vx_ * dt;
      // y += ∫ (vy + ay * t) dt
      y += vy_ * dt - (ay_ * dt * dt) / 2;
      vy -= ((ay * ts.bpm) / 120) * dt;

      tBegin = tEnd;
    }
    notes.push({
      ver: 6,
      id,
      big: c.big,
      hitTimeSec,
      appearTimeSec,
      done: 0,
      bigDone: false,
      display,
      targetX,
    });
  }
  return {
    ver: 6,
    offset: chart.offset,
    signature: level.signature,
    bpmChanges: level.bpmChanges,
    notes,
  };
}
export function displayNote6(
  note: Note6,
  timeSec: number
): DisplayNote6 | null {
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
    const { a, b } = dispParam;
    const t = note.hitTimeSec - dispParam.timeSecBefore - timeSec;
    return {
      id: note.id,
      pos: {
        x: a[0] + a[1] * t,
        y: b[0] + b[1] * t + b[2] * t * t,
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
