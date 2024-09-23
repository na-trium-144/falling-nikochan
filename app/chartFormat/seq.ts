import { timeStamp } from "console";
import { Chart } from "./chart";
import { BPMChange, NoteCommand } from "./command";
import { Step, stepCmp, stepSub, stepToFloat, stepZero } from "./step";

export interface ChartSeqData {
  notes: Note[];
  bpmChanges: BPMChange[];
  offset: number;
}

/**
 * 音符の大きさ (画面サイズに対する割合)
 */
export const noteSize = 0.05;
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
  return targetBpmIndex < 0 ? bpmChanges.length - 1 : targetBpmIndex;
}
/**
 * 時刻(秒数)→bpm
 */
export function findBpmIndexFromStep(
  bpmChanges: BPMChange[],
  step: Step
): number {
  if (bpmChanges.length === 0) {
    return 0;
  }
  const targetBpmIndex =
    bpmChanges.findIndex((ch) => stepCmp(step, ch.step) < 0) - 1;
  return targetBpmIndex < 0 ? bpmChanges.length - 1 : targetBpmIndex;
}
/**
 * chartを読み込む
 */
export function loadChart(chart: Chart): ChartSeqData {
  const notes: Note[] = [];
  for (let id = 0; id < chart.notes.length; id++) {
    const c = chart.notes[id];

    // hitの時刻
    const hitTimeSec: number = getTimeSec(chart.bpmChanges, c.step);
    // timeScaleの変化点それぞれの時刻
    const tsTimeSec: number[] = c.timeScale.map((ts) =>
      getTimeSec(chart.bpmChanges, stepSub(c.step, ts.stepBefore))
    );

    const display: DisplayParam[] = [];
    let x = c.hitX;
    let y = 0;
    let vx = c.hitVX;
    let vy = c.hitVY;
    let appearTimeSec = hitTimeSec;
    for (let ti = 0; ti < c.timeScale.length; ti++) {
      // x += vx * dt
      // y += vy * dt - (c.accelY * dt * dt) / 2;
      display.push({
        timeSecBefore: hitTimeSec - tsTimeSec[ti],
        a: [x, vx],
        b: [y, vy, -c.accelY / 2],
      });

      // tを少しずつ変えながら、x,yが画面内に入っているかをチェック
      for (
        let t = 0;
        !(
          (ti + 1 < c.timeScale.length &&
            t > tsTimeSec[ti + 1] - tsTimeSec[ti]) ||
          t > tsTimeSec[ti] + 1
        );
        t += 0.01
      ) {
        const xt = x + vx * t;
        const yt = y + vy * t - (c.accelY * t * t) / 2;
        if (xt >= -0.5 && xt < 1.5 && yt >= -0.5 && yt < 1.5) {
          appearTimeSec = tsTimeSec[ti] - t;
        }
      }

      if (ti + 1 < c.timeScale.length) {
        const dt = c.timeScale[ti].scale * (hitTimeSec - tsTimeSec[ti + 1]);
        x += vx * dt;
        // y += ∫ (vy + ay * t) dt
        y += vy * dt - (c.accelY * dt * dt) / 2;
        vy -= c.accelY * dt;
      }
    }
    notes.push({
      id,
      big: c.big,
      hitTimeSec,
      appearTimeSec,
      done: 0,
      display,
    });
  }
  return {
    offset: chart.offset,
    bpmChanges: chart.bpmChanges,
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
      chain: note.chain,
      chainBonus: note.chainBonus,
    };
  }
}
