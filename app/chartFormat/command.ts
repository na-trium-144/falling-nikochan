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

export const sampleChart: Chart = {
  ytId: "cNnCLGrXBYs",
  title: "aaaaaa123タイトル",
  author: "author",

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
