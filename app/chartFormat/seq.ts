import { Chart } from "./chart";
import {
  BPMChange,
  defaultSignature,
  getBarLength,
  Signature,
  toStepArray,
} from "./command";
import { Step, stepAdd, stepCmp, stepSub, stepToFloat, stepZero } from "./step";

export interface ChartSeqData {
  notes: Note[];
  bpmChanges: BPMChange[];
  offset: number;
}

/**
 * 判定線の位置
 */
export const targetY = 0.2;
/**
 * big音符の大きさ
 */
export function bigScale(big: boolean) {
  return big ? 1.5 : 1;
}
/**
 * 画面上の位置
 * x: 0(画面左端)〜1(画面右端)
 * y: 0(判定ライン)〜1(画面上端)
 */
export interface Pos {
  x: number;
  y: number;
}
/**
 * ゲーム中で使用する音符の管理
 * id: 通し番号
 * hitTimeSec: 判定時刻
 * appearTimeSec: 画面に表示し始める時刻
 * display: 現在時刻→画面上の位置
 * done: 判定結果 0:まだ 1:Good 2:OK 3:bad 4:miss
 */
export interface Note {
  id: number;
  big: boolean;
  bigDone: boolean;
  hitTimeSec: number;
  appearTimeSec: number;
  hitPos?: Pos;
  done: number;
  chainBonus?: number;
  chain?: number;
  display: DisplayParam[];
}
interface DisplayParam {
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
export interface DisplayNote {
  id: number;
  pos: Pos;
  done: number;
  bigDone: boolean;
  chainBonus?: number;
  chain?: number;
}

function defaultBpmChange(): BPMChange {
  return { timeSec: 0, bpm: 120, step: stepZero() };
}
/**
 * bpmとstep数→時刻(秒数)
 */
export function getTimeSec(bpmChanges: BPMChange[], step: Step): number {
  const targetBpmChange =
    bpmChanges[findBpmIndexFromStep(bpmChanges, step)] || defaultBpmChange();
  return (
    targetBpmChange.timeSec +
    (60 / targetBpmChange.bpm) *
      (stepToFloat(step) - stepToFloat(targetBpmChange.step))
  );
}
/**
 * bpmと時刻(秒数)→step
 */
export function getStep(
  bpmChanges: BPMChange[],
  timeSec: number,
  denominator: number
): Step {
  const targetBpmChange =
    bpmChanges[findBpmIndexFromSec(bpmChanges, timeSec)] || defaultBpmChange();
  const stepFloat =
    stepToFloat(targetBpmChange.step) +
    (timeSec - targetBpmChange.timeSec) / (60 / targetBpmChange.bpm);
  const num = Math.round(stepFloat * denominator);
  return {
    fourth: Math.floor(num / denominator),
    numerator: num % denominator,
    denominator,
  };
}
/**
 * 時刻(step)→小節数+小節内の拍数
 */
export function getSignatureState(
  signature: Signature[],
  step: Step
): SignatureState {
  const targetSignature = signature[findBpmIndexFromStep(signature, step)];
  let barBegin = stepSub(targetSignature.step, targetSignature.offset);
  const barSteps = toStepArray(targetSignature);
  const barLength = getBarLength(targetSignature);
  let barNum = targetSignature.barNum;
  let bi = 0;
  while (true) {
    const barEnd = stepAdd(barBegin, barLength[bi % barLength.length]);
    if (stepCmp(barEnd, step) > 0) {
      for (let si = 0; si < barSteps[bi % barLength.length].length; si++) {
        const barStepEnd = stepAdd(
          barBegin,
          barSteps[bi % barLength.length][si]
        );
        if (stepCmp(barStepEnd, step) > 0) {
          return {
            barNum,
            count: stepAdd(stepSub(step, barBegin), {
              fourth: si,
              numerator: 0,
              denominator: 1,
            }),
          };
        }
        barBegin = barStepEnd;
      }
      throw new Error("should not reach here");
    }
    barNum += 1;
    barBegin = barEnd;
    bi += 1;
  }
}

export interface SignatureState {
  barNum: number;
  count: Step; // これは時刻表現ではなく表示用、count.fourthはbar内のカウントに対応するので時間が飛ぶこともある
}

/**
 * 時刻(秒数)→bpm
 */
export function findBpmIndexFromSec(
  bpmChanges: BPMChange[],
  timeSec: number
): number {
  if (bpmChanges.length === 0) {
    return 0;
  }
  const targetBpmIndex = bpmChanges.findIndex((ch) => timeSec < ch.timeSec) - 1;
  if (targetBpmIndex === -2) {
    return bpmChanges.length - 1;
  }
  if (targetBpmIndex === -1) {
    return 0;
  }
  return targetBpmIndex;
}
/**
 * 時刻(秒数)→bpm
 */
export function findBpmIndexFromStep(
  bpmChanges: BPMChange[] | Signature[],
  step: Step
): number {
  if (bpmChanges.length === 0) {
    return 0;
  }
  const targetBpmIndex =
    bpmChanges.findIndex((ch) => stepCmp(step, ch.step) < 0) - 1;
  if (targetBpmIndex === -2) {
    return bpmChanges.length - 1;
  }
  if (targetBpmIndex === -1) {
    return 0;
  }
  return targetBpmIndex;
}
/**
 * chartを読み込む
 */
export function loadChart(chart: Chart, levelIndex: number): ChartSeqData {
  const notes: Note[] = [];
  const level = chart.levels.at(levelIndex);
  if (!level) {
    return { notes: [], bpmChanges: [], offset: chart.offset };
  }
  for (let id = 0; id < level.notes.length; id++) {
    const c = level.notes[id];

    // hitの時刻
    const hitTimeSec: number = getTimeSec(level.bpmChanges, c.step);

    const display: DisplayParam[] = [];
    let tBegin = hitTimeSec;
    // noteCommandの座標系 (-5<=x<=5) から
    //  displayの座標系に変換するのもここでやる
    let x = (c.hitX + 5) / 10;
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
      id,
      big: c.big,
      hitTimeSec,
      appearTimeSec,
      done: 0,
      bigDone: false,
      display,
    });
  }
  return {
    offset: chart.offset,
    bpmChanges: level.bpmChanges,
    notes,
  };
}
export function displayNote(note: Note, timeSec: number): DisplayNote | null {
  if (timeSec - note.hitTimeSec > 0.5) {
    return null;
  } else if (note.done >= 1 && note.done <= 3) {
    return {
      id: note.id,
      pos: note.hitPos || { x: -1, y: -1 },
      done: note.done,
      bigDone: note.bigDone,
      chain: note.chain,
      chainBonus: note.chainBonus,
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
      chainBonus: note.chainBonus,
    };
  }
}
