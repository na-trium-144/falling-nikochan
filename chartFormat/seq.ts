import { Chart } from "./chart.js";
import { getBarLength, Signature, toStepArray } from "./signature.js";
import { BPMChange } from "./bpm.js";
import {
  Step,
  stepAdd,
  stepCmp,
  stepSub,
  stepToFloat,
  stepZero,
} from "./step.js";

export interface ChartSeqData {
  notes: Note[];
  bpmChanges: BPMChange[];
  signature: Signature[];
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
  targetX: number;
  vx: number;
  vy: number;
  ay: number;
  display: DisplayParam[];
  hitPos?: Pos;
  done: number;
  baseScore?: number;
  chainBonus?: number;
  bigBonus?: number;
  chain?: number;
}
interface DisplayParam {
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
export interface DisplayNote {
  id: number;
  pos: Pos;
  done: number;
  bigDone: boolean;
  baseScore?: number;
  chainBonus?: number;
  bigBonus?: number;
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
      let barStepBegin = barBegin;
      for (let si = 0; si < barSteps[bi % barLength.length].length; si++) {
        const barStepEnd = stepAdd(
          barStepBegin,
          barSteps[bi % barLength.length][si]
        );
        if (stepCmp(barStepEnd, step) > 0) {
          return {
            barNum,
            bar: targetSignature.bars[bi % barLength.length],
            stepAligned: barStepBegin,
            offset: stepSub(step, barBegin),
            count: stepAdd(stepSub(step, barStepBegin), {
              fourth: si,
              numerator: 0,
              denominator: 1,
            }),
          };
        }
        barStepBegin = barStepEnd;
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
  bar: (4 | 8 | 16)[];
  stepAligned: Step; // このカウントの開始にあわせた時刻
  offset: Step; // barの最初からの時刻
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
    return { notes: [], bpmChanges: [], signature: [], offset: chart.offset };
  }
  for (let id = 0; id < level.notes.length; id++) {
    const c = level.notes[id];

    // hitの時刻
    const hitTimeSec: number = getTimeSec(level.bpmChanges, c.step);

    const display: DisplayParam[] = [];
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

    let appearTimeSec = hitTimeSec;
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

      if (u < uAppear && uEnd > uAppear) {
        const tAppear = (uAppear - u) / du;
        appearTimeSec = tBegin - tAppear;
      }
      tBegin = tEnd;
      u = uEnd;
    }
    notes.push({
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
    offset: chart.offset,
    signature: level.signature,
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
