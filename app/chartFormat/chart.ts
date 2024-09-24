import {
  BPMChange,
  NoteCommand,
  updateBpmTimeSec,
  validateBpmChange,
  validateNoteCommand,
} from "./command";
import { Step } from "./step";

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
  ver: 1;
  notes: NoteCommand[];
  bpmChanges: BPMChange[];
  offset: number;
  waveOffset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}

export function validateChart(chart: Chart) {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 1) throw "chart.ver is invalid";
  if (!Array.isArray(chart.notes)) throw "chart.notes is invalid";
  chart.notes.forEach((n) => validateNoteCommand(n));
  if (!Array.isArray(chart.bpmChanges)) throw "chart.bpmChanges is invalid";
  chart.bpmChanges.forEach((n) => validateBpmChange(n));
  updateBpmTimeSec(chart.bpmChanges);
  if (typeof chart.offset !== "number") chart.offset = 0;
  if (typeof chart.waveOffset !== "number") chart.waveOffset = 0;
  if (typeof chart.ytId !== "string") throw "chart.ytId is invalid";
  if (typeof chart.title !== "string") chart.title = "";
  if (typeof chart.composer !== "string") chart.composer = "";
  if (typeof chart.chartCreator !== "string") chart.chartCreator = "";
  if (typeof chart.editPasswd !== "string") chart.editPasswd = "";
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

export function emptyChart(): Chart {
  return {
    falling: "nikochan",
    ver: 1,
    notes: [],
    bpmChanges: [],
    offset: 0,
    waveOffset: 0,
    ytId: "",
    title: "",
    composer: "",
    chartCreator: "",
    editPasswd: "",
  };
}

function step(f: number, n: number = 0, d: number = 16): Step {
  return { fourth: f, numerator: n, denominator: d / 4 };
}
