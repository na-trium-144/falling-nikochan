import {
  BPMChange,
  NoteCommand,
  updateBpmTimeSec,
  validateBpmChange,
  validateNoteCommand,
} from "./command";
import { Chart1, convert1To2 } from "./legacy/chart1";
import { Step, stepZero } from "./step";

export interface ChartBrief {
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
}

/**
 * 譜面データを保存しておく形式
 * notes: 1音符1要素
 * bpmChanges: bpm変化の情報
 * offset: step=0に対応する時刻(秒)
 * (offsetの処理はgetCurrentTimeSec()の中に含まれる)
 * waveOffset: edit画面で波形の表示位置を補正(仮)
 *
 * 時刻は開始からのstep数(60/BPM*step=秒)で管理する。
 * プレイ時に秒単位の時刻に変換
 */
export interface Chart {
  falling: "nikochan"; // magic
  ver: 2;
  notes: NoteCommand[];
  bpmChanges: BPMChange[];
  scaleChanges: BPMChange[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}

export function validateChart(chart_: Chart | Chart1) {
  if (chart_.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart_.ver === 1) {
    chart_ = convert1To2(chart_);
  }
  if (chart_.ver !== 2) throw "chart.ver is invalid";
  const chart = chart_ as Chart;
  if (!Array.isArray(chart.notes)) throw "chart.notes is invalid";
  chart.notes.forEach((n) => validateNoteCommand(n));
  if (!Array.isArray(chart.bpmChanges)) throw "chart.bpmChanges is invalid";
  chart.bpmChanges.forEach((n) => validateBpmChange(n));
  if (!Array.isArray(chart.scaleChanges)) throw "chart.scaleChanges is invalid";
  chart.scaleChanges.forEach((n) => validateBpmChange(n));
  updateBpmTimeSec(chart.bpmChanges, chart.scaleChanges);
  if (typeof chart.offset !== "number") chart.offset = 0;
  if (typeof chart.ytId !== "string") throw "chart.ytId is invalid";
  if (typeof chart.title !== "string") chart.title = "";
  if (typeof chart.composer !== "string") chart.composer = "";
  if (typeof chart.chartCreator !== "string") chart.chartCreator = "";
  if (typeof chart.editPasswd !== "string") chart.editPasswd = "";
  return chart;
}

export async function hashPasswd(text: string) {
  const msgUint8 = new TextEncoder().encode(text); // (utf-8 の) Uint8Array にエンコードする
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // メッセージをハッシュする
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // バッファーをバイト列に変換する
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // バイト列を 16 進文字列に変換する
  return hashHex;
}

export function validCId(cid: string) {
  return cid.length === 6 && Number(cid) >= 100000 && Number(cid) < 1000000;
}

export function emptyChart(): Chart {
  return {
    falling: "nikochan",
    ver: 2,
    notes: [],
    bpmChanges: [{ step: stepZero(), timeSec: 0, bpm: 120 }],
    scaleChanges: [{ step: stepZero(), timeSec: 0, bpm: 120 }],
    offset: 0,
    ytId: "",
    title: "",
    composer: "",
    chartCreator: "",
    editPasswd: "",
  };
}
