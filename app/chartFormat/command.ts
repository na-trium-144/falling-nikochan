/**
 * 譜面データを保存しておく形式
 * notes: 1音符1要素
 * bpmChanges: bpm変化の情報
 *
 * 時刻は開始からのstep数(60/BPM*step=秒)で管理する。
 * プレイ時に秒単位の時刻に変換
 */
export interface Chart {
  notes: NoteCommand[];
  bpmChanges: BPMChange[];
}

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

export const sampleChart: Chart = {
  bpmChanges: [{ step: 0, bpm: 120 }],
  notes: [
    {
      step: 4,
      hitX: 0,
      hitVX: 1 / 4,
      hitVY: 2 / 4,
      accelY: 1 / 4,
      timeScale: [{ stepBefore: 0, scale: 1 }],
    },
    {
      step: 5,
      hitX: 1 / 4,
      hitVX: 1 / 4,
      hitVY: 2 / 4,
      accelY: 1 / 4,
      timeScale: [{ stepBefore: 0, scale: 1 }],
    },
    {
      step: 6,
      hitX: 2 / 4,
      hitVX: 1 / 4,
      hitVY: 2 / 4,
      accelY: 1 / 4,
      timeScale: [{ stepBefore: 0, scale: 1 }],
    },
    {
      step: 7,
      hitX: 3 / 4,
      hitVX: 1 / 4,
      hitVY: 2 / 4,
      accelY: 1 / 4,
      timeScale: [{ stepBefore: 0, scale: 1 }],
    },
  ],
};
