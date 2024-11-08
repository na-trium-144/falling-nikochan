import {
  BPMChangeWithLua,
  NoteCommandWithLua,
  RestStep,
  Signature,
  SignatureWithLua,
  updateBpmTimeSec,
  validateBpmChange,
  validateNoteCommand,
  validateRestStep,
  validateSignature,
} from "./command";
import { difficulty } from "./difficulty";
import { Chart1, convert1To2 } from "./legacy/chart1";
import { Chart2, convert2To3 } from "./legacy/chart2";
import { Chart3, convert3To4 } from "./legacy/chart3";
import { Chart4, convert4To5, Level4 } from "./legacy/chart4";
import { luaAddBpmChange } from "./lua/bpm";
import { luaAddBeatChange } from "./lua/signature";
import { luaAddSpeedChange } from "./lua/speed";
import { getTimeSec } from "./seq";
import { stepZero } from "./step";

export interface ChartBrief {
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  updatedAt: number;
  playCount?: number;
  levels: {
    name: string;
    hash: string;
    type: string;
    difficulty: number;
    noteCount: number;
    bpmMin: number;
    bpmMax: number;
    length: number;
  }[];
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
 *
 * 時刻は開始からのstep数(60/BPM*step=秒)で管理する。
 * プレイ時に秒単位の時刻に変換
 *
 * hashはbestScoreの管理のためだけに使う
 *
 * updatedAtは new Date().getTime()
 * サーバーに送信時に前のchartのhashと比較してサーバーがアップデートする
 * クライアント側は全く使わない
 *
 */
export interface Chart {
  falling: "nikochan"; // magic
  ver: 5;
  levels: Level[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
  updatedAt: number;
}
export interface Level {
  name: string;
  type: string;
  hash: string;
  notes: NoteCommandWithLua[];
  rest: RestStep[];
  bpmChanges: BPMChangeWithLua[];
  speedChanges: BPMChangeWithLua[];
  signature: SignatureWithLua[];
  lua: string[];
}
export const levelTypes = ["Single", "Double", "Maniac"];
export const levelColors = [
  "text-emerald-700 dark:text-emerald-400 ",
  "text-amber-700 dark:text-amber-400 ",
  "text-rose-700 dark:text-rose-400 ",
];
export const levelBgColors = [
  "bg-emerald-500 dark:bg-emerald-800 ",
  "bg-amber-500 dark:bg-amber-800 ",
  "bg-rose-500 dark:bg-rose-800 ",
];

export const chartMaxSize = 1000000;

export async function validateChart(
  chart: Chart | Chart1 | Chart2 | Chart3 | Chart4
): Promise<Chart> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver === 1) chart = convert1To2(chart);
  if (chart.ver === 2) chart = convert2To3(chart);
  if (chart.ver === 3) chart = await convert3To4(chart);
  if (chart.ver === 4) chart = convert4To5(chart);
  if (chart.ver !== 5) throw "chart.ver is invalid";
  if (!Array.isArray(chart.levels)) throw "chart.levels is invalid";
  chart.levels.forEach((l) => validateLevel(l));
  if (typeof chart.offset !== "number") chart.offset = 0;
  if (typeof chart.ytId !== "string") throw "chart.ytId is invalid";
  if (typeof chart.title !== "string") chart.title = "";
  if (typeof chart.composer !== "string") chart.composer = "";
  if (typeof chart.chartCreator !== "string") chart.chartCreator = "";
  if (typeof chart.editPasswd !== "string") chart.editPasswd = "";
  if (typeof chart.updatedAt !== "number") chart.updatedAt = 0;
  return chart;
}
export function validateLevel(level: Level): Level {
  if (typeof level.name !== "string") throw "level.name is invalid";
  if (typeof level.hash !== "string") throw "level.hash is invalid";
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
  if (!Array.isArray(level.signature))
    throw "level.signatureChanges is invalid";
  level.signature.forEach((n) => validateSignature(n));
  if (!Array.isArray(level.lua)) throw "level.lua is invalid";
  if (level.lua.filter((l) => typeof l !== "string").length > 0)
    throw "level.lua is invalid";
  return level;
}

export async function hash(text: string) {
  const msgUint8 = new TextEncoder().encode(text); // (utf-8 の) Uint8Array にエンコードする
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // メッセージをハッシュする
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // バッファーをバイト列に変換する
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // バイト列を 16 進文字列に変換する
  return hashHex;
}
export async function hashPasswd(text: string) {
  return await hash(text);
}
export async function hashLevel(level: Level) {
  return await hash(
    JSON.stringify([
      level.notes,
      level.bpmChanges,
      level.speedChanges,
      level.signature,
    ])
  );
}
export async function hashLevel4(level: Level4) {
  return await hash(
    JSON.stringify([level.notes, level.bpmChanges, level.speedChanges])
  );
}

export function validCId(cid: string) {
  return cid.length === 6 && Number(cid) >= 100000 && Number(cid) < 1000000;
}

export function emptyChart(): Chart {
  let chart: Chart = {
    falling: "nikochan",
    ver: 5,
    levels: [emptyLevel()],
    offset: 0,
    ytId: "",
    title: "",
    composer: "",
    chartCreator: "",
    editPasswd: "",
    updatedAt: 0,
  };
  return chart;
}
// prevLevelからbpmとspeedだけはコピー
export function emptyLevel(prevLevel?: Level): Level {
  let level: Level = {
    name: "",
    hash: "",
    type: levelTypes[0],
    notes: [],
    rest: [],
    bpmChanges: [],
    speedChanges: [],
    signature: [],
    lua: [],
  };
  if (prevLevel) {
    for (const change of prevLevel.bpmChanges) {
      level = luaAddBpmChange(level, change)!;
    }
    for (const change of prevLevel.speedChanges) {
      level = luaAddSpeedChange(level, change)!;
    }
    for (const s of prevLevel.signature) {
      level = luaAddBeatChange(level, s)!;
    }
  } else {
    level = luaAddBpmChange(level, { bpm: 120, step: stepZero(), timeSec: 0 })!;
    level = luaAddSpeedChange(level, {
      bpm: 120,
      step: stepZero(),
      timeSec: 0,
    })!;
    level = luaAddBeatChange(level, {
      step: stepZero(),
      offset: stepZero(),
      barNum: 0,
      bars: [[4, 4, 4, 4]],
    })!;
  }
  return level;
}
export function copyLevel(level: Level): Level {
  return {
    name: level.name,
    hash: level.hash,
    type: level.type,
    notes: level.notes.map((n) => ({ ...n })),
    rest: level.rest.map((r) => ({ ...r })),
    bpmChanges: level.bpmChanges.map((b) => ({ ...b })),
    speedChanges: level.speedChanges.map((b) => ({ ...b })),
    signature: level.signature.map((s) => ({ ...s })),
    lua: level.lua.slice(),
  };
}

export function createBrief(chart: Chart): ChartBrief {
  const levelBrief = chart.levels.map((level) => ({
    name: level.name,
    hash: level.hash,
    type: level.type,
    noteCount: level.notes.length,
    difficulty: difficulty(level, level.type),
    bpmMin: level.bpmChanges.map((b) => b.bpm).reduce((a, b) => Math.min(a, b)),
    bpmMax: level.bpmChanges.map((b) => b.bpm).reduce((a, b) => Math.max(a, b)),
    length:
      level.notes.length >= 1
        ? getTimeSec(level.bpmChanges, level.notes[level.notes.length - 1].step)
        : 0,
  }));
  return {
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    levels: levelBrief,
    updatedAt: chart.updatedAt,
  };
}
