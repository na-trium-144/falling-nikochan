/**
 * 譜面データを保存しておく形式
 * notes: 1音符1要素
 * bpmChanges: bpm変化の情報
 * offset: step=0に対応する時刻(秒)
 * (offsetの処理はgetCurrentTimeSec()の中に含まれる)
 *
 * 時刻は開始からのstep数(60/BPM*step=秒)で管理する。
 * プレイ時に秒単位の時刻に変換
 */
export interface Chart {
  notes: NoteCommand[];
  bpmChanges: BPMChange[];
  offset: number;
  ytId: string;
  title: string;
  author: string;
}

/**
 * 時刻(step数)の数え方
 * 4分音符の個数 = fourth + numerator / denominator
 * パラメーターはいずれも自然数で、 numerator < denominator
 * ただし既約分数であるとは限らない
 */
export interface Step {
  fourth: number;
  numerator: number;
  denominator: number;
}
export function stepZero() {
  return { fourth: 0, numerator: 0, denominator: 4 };
}
function step(f: number, n: number = 0, d: number = 16): Step {
  return { fourth: f, numerator: n, denominator: d / 4 };
}
export function stepToFloat(s: Step) {
  return s.fourth + s.numerator / s.denominator;
}
/**
 * 1: s1 > s2
 * 0: s1 = s2
 * -1: s1 < s2
 */
export function stepCmp(s1: Step, s2: Step) {
  if (
    s1.fourth === s2.fourth &&
    s1.numerator * s2.denominator === s1.denominator * s2.numerator
  ) {
    return 0;
  } else {
    return Math.sign(stepToFloat(s1) - stepToFloat(s2));
  }
}
/**
 * s1 - s2
 */
export function stepSub(s1: Step, s2: Step) {
  return stepAdd(s1, {
    fourth: -s2.fourth,
    numerator: -s2.numerator,
    denominator: s2.denominator,
  });
}
/**
 * s1 + s2
 */
export function stepAdd(s1: Step, s2: Step) {
  const sa: Step = {
    fourth: s1.fourth + s2.fourth,
    numerator: s1.numerator * s2.denominator + s2.numerator * s1.denominator,
    denominator: s1.denominator * s2.denominator,
  };
  sa.fourth += Math.floor(sa.numerator / sa.denominator);
  sa.numerator -= Math.floor(sa.numerator / sa.denominator) * sa.denominator;
  for (let i = 2; i <= sa.numerator && i <= sa.denominator; i++) {
    while (sa.numerator % i == 0 && sa.denominator % i == 0) {
      sa.numerator /= i;
      sa.denominator /= i;
    }
  }
  return sa;
}

/**
 * 音符コマンド
 * step: 判定時刻(step数)
 * hitX: 判定時のX
 * (hitY = 0)
 * hitVX: 判定時のX速度
 * hitVY: 判定時のY速度
 * (accelX = 0)
 * accelY: Y加速度
 * timeScale: { 時刻(判定時刻 - step数), VX,VY,accelYの倍率 } のリスト
 */
export interface NoteCommand {
  step: Step;
  hitX: number;
  hitVX: number;
  hitVY: number;
  accelY: number;
  timeScale: {
    stepBefore: Step;
    scale: number;
  }[];
}
/**
 *       timeSec +=
        (60 / bpmChanges[bi].bpm) *
        (bpmChanges[bi + 1].step - bpmChanges[bi].step);
 */
export interface BPMChange {
  step: Step;
  timeSec: number;
  bpm: number;
}
/**
 * stepが正しいとしてtimeSecを再計算
 */
export function updateBpmTimeSec(bpmChanges: BPMChange[]) {
  let timeSum = 0;
  for (let bi = 0; bi < bpmChanges.length; bi++) {
    bpmChanges[bi].timeSec = timeSum;
    console.log(bpmChanges[bi]);
    if (bi + 1 < bpmChanges.length) {
      timeSum +=
        (60 / bpmChanges[bi].bpm) *
        (stepToFloat(bpmChanges[bi + 1].step) -
          stepToFloat(bpmChanges[bi].step));
    }
  }
}

export const sampleChart = (): Chart => {
  let notes: NoteCommand[] = [];
  const def = {
    hitX: 1 / 4,
    hitVX: 1 / 4,
    hitVY: 1,
    accelY: 1 / 4,
    timeScale: [{ stepBefore: step(0), scale: 1 }],
  };
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      notes.push({ ...def, step: step(16 + j + i * 4) });
    }
  }
  notes.push({ ...def, step: step(28) });
  notes.push({ ...def, step: step(29) });
  notes.push({ ...def, step: step(30), hitX: 1 / 4, hitVX: 1 / 4 });
  notes.push({ ...def, step: step(30, 1, 8), hitX: 2 / 4, hitVX: 1 / 4 });
  notes.push({ ...def, step: step(31), hitX: 3 / 4, hitVX: 1 / 4 });

  for (let i = 0; i < 4; i++) {
    notes.push({ ...def, step: step(32 + i * 8) });
    notes.push({ ...def, step: step(32 + i * 8 + 1, 3, 16) });
    notes.push({ ...def, step: step(32 + i * 8 + 2, 3, 16) });
    notes.push({ ...def, step: step(32 + i * 8 + 4) });
    notes.push({ ...def, step: step(32 + i * 8 + 5, 3, 16) });
    notes.push({ ...def, step: step(32 + i * 8 + 7) });
  }
  for (let j = 0; j < 14; j++) {
    notes.push({ ...def, step: step(64 + j) });
  }
  notes.push({ ...def, step: step(64 + 14) });
  notes.push({ ...def, step: step(64 + 14, 1, 8), hitX: 2 / 4 });
  notes.push({ ...def, step: step(64 + 15) });
  for (let j = 0; j < 14; j++) {
    notes.push({ ...def, step: step(64 + 16 + j) });
  }
  notes.push({ ...def, step: step(64 + 16 + 13, 3, 16) });
  notes.push({ ...def, step: step(64 + 16 + 14, 1, 8) });
  notes.push({ ...def, step: step(64 + 16 + 15) });

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 4; j++) {
      notes.push({ ...def, step: step(96 + i * 8 + j) });
    }
    notes.push({ ...def, step: step(96 + i * 8 + 4), hitX: 3 / 4 });
    notes.push({ ...def, step: step(96 + i * 8 + 5) });
    notes.push({ ...def, step: step(96 + i * 8 + 6), hitX: 3 / 4 });
    notes.push({ ...def, step: step(96 + i * 8 + 6, 1, 8), hitX: 2 / 4 });
    notes.push({ ...def, step: step(96 + i * 8 + 7) });
  }

  return {
    ytId: "cNnCLGrXBYs",
    title: "aaaaaa123タイトル",
    author: "author",

    bpmChanges: [
      {
        step: { fourth: 0, numerator: 0, denominator: 4 },
        timeSec: 0,
        bpm: 127.0,
      },
    ],
    offset: 0,
    notes,
  };
};
