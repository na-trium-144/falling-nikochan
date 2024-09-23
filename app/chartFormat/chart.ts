import { BPMChange, NoteCommand, validateBpmChange, validateNoteCommand } from "./command";
import { Step } from "./step";

export interface ChartBrief {
  ytId: string;
  title: string;
  composer: string;
}

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
export interface Chart extends ChartBrief {
  falling: "nikochan"; // magic
  ver: 1;
  notes: NoteCommand[];
  bpmChanges: BPMChange[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
}

export function validateChart(chart: Chart) {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 1) throw "chart.ver is invalid";
  if (!Array.isArray(chart.notes)) throw "chart.notes is invalid";
  chart.notes.forEach((n) => validateNoteCommand(n));
  if (!Array.isArray(chart.bpmChanges)) throw "chart.bpmChanges is invalid";
  chart.bpmChanges.forEach((n) => validateBpmChange(n));
  if (typeof chart.offset !== "number") throw "chart.offset is invalid";
  if (typeof chart.ytId !== "string") throw "chart.ytId is invalid";
  if (typeof chart.title !== "string") throw "chart.title is invalid";
  if (typeof chart.composer !== "string") throw "chart.composer is invalid";
}

export function emptyChart(): Chart {
  return {
    falling: "nikochan",
    ver: 1,
    notes: [],
    bpmChanges: [],
    offset: 0,
    ytId: "",
    title: "",
    composer: "",
  };
}

function step(f: number, n: number = 0, d: number = 16): Step {
  return { fourth: f, numerator: n, denominator: d / 4 };
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
    falling: "nikochan",
    ver: 1,
    ytId: "cNnCLGrXBYs",
    title: "aaaaaa123タイトル",
    composer: "author",

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

