import {
  BPMChangeWithLua,
  NoteCommandWithLua,
  RestStep,
  updateBpmTimeSec,
  validateBpmChange,
  validateNoteCommand,
  validateRestStep,
} from "./command";
import { Chart1, convert1To2 } from "./legacy/chart1";
import { Chart2, convert2To3 } from "./legacy/chart2";
import { luaAddBpmChange } from "./lua/bpm";
import { luaAddSpeedChange } from "./lua/speed";
import { stepZero } from "./step";

export interface ChartBrief {
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
}

/**
 * 譜面データを保存しておく形式
 * notes: 1音符1要素
 * rest: 休符
 *   notesそれぞれにstepの情報は入っているので、譜面を読むだけなら無くてもいい
 *   エディタがluaを編集するときどこにNoteコマンドを挿入するかの判断に使う。
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
  ver: 3;
  notes: NoteCommandWithLua[];
  rest: RestStep[];
  bpmChanges: BPMChangeWithLua[];
  speedChanges: BPMChangeWithLua[];
  offset: number;
  lua: string[];
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}

export const chartMaxSize = 100000;

export function validateChart(chart: Chart | Chart1 | Chart2): Chart {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver === 1) {
    chart = convert1To2(chart);
  }
  if (chart.ver === 2) {
    chart = convert2To3(chart);
  }
  if (chart.ver !== 3) throw "chart.ver is invalid";
  if (!Array.isArray(chart.notes)) throw "chart.notes is invalid";
  chart.notes.forEach((n) => validateNoteCommand(n));
  if (!Array.isArray(chart.rest)) throw "chart.rest is invalid";
  chart.rest.forEach((n) => validateRestStep(n));
  if (!Array.isArray(chart.bpmChanges)) throw "chart.bpmChanges is invalid";
  chart.bpmChanges.forEach((n) => validateBpmChange(n));
  if (!Array.isArray(chart.speedChanges)) throw "chart.speedChanges is invalid";
  chart.speedChanges.forEach((n) => validateBpmChange(n));
  updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  if (typeof chart.offset !== "number") chart.offset = 0;
  if (!Array.isArray(chart.lua)) throw "chart.lua is invalid";
  if (chart.lua.filter((l) => typeof l !== "string").length > 0)
    throw "chart.lua is invalid";
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
  let chart: Chart = {
    falling: "nikochan",
    ver: 3,
    notes: [],
    rest: [],
    bpmChanges: [],
    speedChanges: [],
    offset: 0,
    lua: [],
    ytId: "",
    title: "",
    composer: "",
    chartCreator: "",
    editPasswd: "",
  };
  chart = luaAddBpmChange(chart, { bpm: 120, step: stepZero(), timeSec: 0 })!;
  chart = luaAddSpeedChange(chart, { bpm: 120, step: stepZero(), timeSec: 0 })!;
  return chart;
}
