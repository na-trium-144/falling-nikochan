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
  step: number;
  hitX: number;
  hitVX: number;
  hitVY: number;
  accelY: number;
  timeScale: {
    stepBefore: number;
    scale: number;
  }[];
}
export interface BPMChange {
  step: number;
  bpm: number;
}

export const sampleChart = (): Chart => {
  let notes: NoteCommand[] = [];
  const def = {
    hitX: 1 / 4,
    hitVX: 1 / 4,
    hitVY: 1,
    accelY: 3 / 4,
    timeScale: [{ stepBefore: 0, scale: 1 }],
  };
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      notes.push({ ...def, step: 16 + j + i * 4 });
    }
  }
  notes.push({ ...def, step: 28 });
  notes.push({ ...def, step: 29 });
  notes.push({ ...def, step: 30, hitX: 1 / 4, hitVX: 1 / 4 });
  notes.push({ ...def, step: 30.5, hitX: 2 / 4, hitVX: 1 / 4 });
  notes.push({ ...def, step: 31, hitX: 3 / 4, hitVX: 1 / 4 });

  for (let i = 0; i < 4; i++) {
    notes.push({ ...def, step: 32 + i * 8 });
    notes.push({ ...def, step: 32 + i * 8 + 1.75 });
    notes.push({ ...def, step: 32 + i * 8 + 2.75 });
    notes.push({ ...def, step: 32 + i * 8 + 4 });
    notes.push({ ...def, step: 32 + i * 8 + 5.75 });
    notes.push({ ...def, step: 32 + i * 8 + 7 });
  }
  for (let j = 0; j < 14; j++) {
    notes.push({ ...def, step: 64 + j });
  }
  notes.push({ ...def, step: 64 + 14 });
  notes.push({ ...def, step: 64 + 14.5, hitX: 2 / 4 });
  notes.push({ ...def, step: 64 + 15 });
  for (let j = 0; j < 14; j++) {
    notes.push({ ...def, step: 64 + 16 + j });
  }
  notes.push({ ...def, step: 64 + 16 + 13.75 });
  notes.push({ ...def, step: 64 + 16 + 14.5 });
  notes.push({ ...def, step: 64 + 16 + 15 });

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 4; j++) {
      notes.push({ ...def, step: 96 + i * 8 + j });
    }
    notes.push({ ...def, step: 96 + i * 8 + 4, hitX: 3 / 4 });
    notes.push({ ...def, step: 96 + i * 8 + 5 });
    notes.push({ ...def, step: 96 + i * 8 + 6, hitX: 3 / 4 });
    notes.push({ ...def, step: 96 + i * 8 + 6.5, hitX: 2 / 4 });
    notes.push({ ...def, step: 96 + i * 8 + 7 });
  }
  
  return {
    ytId: "cNnCLGrXBYs",
    title: "aaaaaa123タイトル",
    author: "author",

    bpmChanges: [{ step: 0, bpm: 127.0 }],
    offset: 0,
    notes,
  };
};
