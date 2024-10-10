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
import { Chart3, convert3To4 } from "./legacy/chart3";
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
  ver: 4;
  levels: Level[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}
export interface Level {
  name: string;
  type: string;
  notes: NoteCommandWithLua[];
  rest: RestStep[];
  bpmChanges: BPMChangeWithLua[];
  speedChanges: BPMChangeWithLua[];
  lua: string[];
}
export const levelTypes = ["Single", "Double", "Maniac"];
export const levelColors = [
  "text-emerald-700 ",
  "text-yellow-700 ",
  "text-pink-700 ",
];

export const chartMaxSize = 100000;

export function validateChart(chart: Chart | Chart1 | Chart2 | Chart3): Chart {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver === 1) chart = convert1To2(chart);
  if (chart.ver === 2) chart = convert2To3(chart);
  if (chart.ver === 3) chart = convert3To4(chart);
  if (chart.ver !== 4) throw "chart.ver is invalid";
  if (!Array.isArray(chart.levels)) throw "chart.levels is invalid";
  chart.levels.forEach((l) => validateLevel(l));
  if (typeof chart.offset !== "number") chart.offset = 0;
  if (typeof chart.ytId !== "string") throw "chart.ytId is invalid";
  if (typeof chart.title !== "string") chart.title = "";
  if (typeof chart.composer !== "string") chart.composer = "";
  if (typeof chart.chartCreator !== "string") chart.chartCreator = "";
  if (typeof chart.editPasswd !== "string") chart.editPasswd = "";
  return chart;
}
export function validateLevel(level: Level): Level {
  if (typeof level.name !== "string") throw "level.name is invalid";
  if (typeof level.type !== "string") throw "level.type is invalid";
  if (!Array.isArray(level.notes)) throw "level.notes is invalid";
  level.notes.forEach((n) => validateNoteCommand(n));
  if (!Array.isArray(level.rest)) throw "level.rest is invalid";
  level.rest.forEach((n) => validateRestStep(n));
  if (!Array.isArray(level.bpmChanges)) throw "level.bpmChanges is invalid";
  level.bpmChanges.forEach((n) => validateBpmChange(n));
  if (!Array.isArray(level.speedChanges)) throw "level.speedChanges is invalid";
  level.speedChanges.forEach((n) => validateBpmChange(n));
  updateBpmTimeSec(level.bpmChanges, level.speedChanges);
  if (!Array.isArray(level.lua)) throw "level.lua is invalid";
  if (level.lua.filter((l) => typeof l !== "string").length > 0)
    throw "level.lua is invalid";
  return level;
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
    ver: 4,
    levels: [],
    offset: 0,
    ytId: "",
    title: "",
    composer: "",
    chartCreator: "",
    editPasswd: "",
  };
  return chart;
}
// prevLevelからbpmとspeedだけはコピー
export function emptyLevel(prevLevel?: Level): Level {
  let level: Level = {
    name: "",
    type: levelTypes[0],
    notes: [],
    rest: [],
    bpmChanges: prevLevel?.bpmChanges.slice() || [],
    speedChanges: prevLevel?.speedChanges.slice() || [],
    lua: [],
  };
  if (!prevLevel) {
    level = luaAddBpmChange(level, { bpm: 120, step: stepZero(), timeSec: 0 })!;
    level = luaAddSpeedChange(level, {
      bpm: 120,
      step: stepZero(),
      timeSec: 0,
    })!;
  }
  return level;
}
