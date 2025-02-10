import { updateBpmTimeSec, validateBpmChange } from "./bpm.js";
import { validateNoteCommand, validateRestStep } from "./command.js";
import { difficulty } from "./difficulty.js";
import { Chart1 } from "./legacy/chart1.js";
import { Chart2 } from "./legacy/chart2.js";
import { Chart3 } from "./legacy/chart3.js";
import { Chart4 } from "./legacy/chart4.js";
import { Chart5 } from "./legacy/chart5.js";
import { Chart6 } from "./legacy/chart6.js";
import { Chart7, convertTo7, hashLevel7, Level7 } from "./legacy/chart7.js";
import { luaAddBpmChange } from "./lua/bpm.js";
import { luaAddBeatChange } from "./lua/signature.js";
import { luaAddSpeedChange } from "./lua/speed.js";
import { getTimeSec } from "./seq.js";
import { validateSignature } from "./signature.js";
import { stepZero } from "./step.js";

/**
 * share時など情報表示に使われるデータ形式
 */
export interface ChartBrief {
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  updatedAt: number;
  playCount?: number;
  published: boolean;
  levels: {
    name: string;
    hash: string;
    type: string;
    difficulty: number;
    noteCount: number;
    bpmMin: number;
    bpmMax: number;
    length: number;
    unlisted: boolean;
  }[];
}
export function pageTitle(cid: string, brief: ChartBrief) {
  return (
    brief.title +
    (brief.title && brief.composer ? " / " : brief.title ? " " : "") +
    brief.composer +
    (brief.composer ? " - " : brief.title ? "- " : "") +
    (brief.chartCreator ? "Chart by " + brief.chartCreator : "") +
    ` (ID: ${cid})`
  );
}

/**
 * edit時に使われるデータ形式
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
export const currentChartVer = 7;
export type Chart = Chart7;
export type Level = Level7;
export const levelTypes = ["Single", "Double", "Maniac"];

export const chartMaxSize = 1000000;

export async function validateChart(
  chart: Chart | Chart1 | Chart2 | Chart3 | Chart4 | Chart5 | Chart6
): Promise<Chart> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 7) chart = await convertTo7(chart);
  if (chart.ver !== currentChartVer) throw "chart.ver is invalid";
  if (!Array.isArray(chart.levels)) throw "chart.levels is invalid";
  chart.levels.forEach((l) => validateLevel(l));
  if (typeof chart.offset !== "number") chart.offset = 0;
  if (typeof chart.ytId !== "string") throw "chart.ytId is invalid";
  if (typeof chart.title !== "string") chart.title = "";
  if (typeof chart.composer !== "string") chart.composer = "";
  if (typeof chart.chartCreator !== "string") chart.chartCreator = "";
  if (typeof chart.editPasswd !== "string") chart.editPasswd = "";
  if (typeof chart.published !== "boolean") chart.published = false;
  return chart;
}
export function validateLevel(level: Level): Level {
  if (typeof level.name !== "string") throw "level.name is invalid";
  if (!levelTypes.includes(level.type)) throw "level.type is invalid";
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
  if (typeof level.unlisted !== "boolean") level.unlisted = false;
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
export const hashLevel = hashLevel7;

export function validCId(cid: string) {
  return cid.length === 6 && Number(cid) >= 100000 && Number(cid) < 1000000;
}

export function emptyChart(): Chart {
  let chart: Chart = {
    falling: "nikochan",
    ver: currentChartVer,
    levels: [emptyLevel()],
    offset: 0,
    ytId: "",
    title: "",
    composer: "",
    chartCreator: "",
    editPasswd: "",
    published: false,
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
    bpmChanges: [],
    speedChanges: [],
    signature: [],
    lua: [],
    unlisted: false,
  };
  if (prevLevel) {
    for (const change of prevLevel.bpmChanges) {
      level = luaAddBpmChange(level, change)!;
    }
    for (const change of prevLevel.speedChanges) {
      level = luaAddSpeedChange(level, change)!;
    }
    for (const s of prevLevel.signature) {
      level = luaAddBeatChange(level, s)! as Level;
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
    })! as Level;
  }
  return level;
}
export function copyLevel(level: Level): Level {
  return {
    name: level.name,
    type: level.type,
    notes: level.notes.map((n) => ({ ...n })),
    rest: level.rest.map((r) => ({ ...r })),
    bpmChanges: level.bpmChanges.map((b) => ({ ...b })),
    speedChanges: level.speedChanges.map((b) => ({ ...b })),
    signature: level.signature.map((s) => ({ ...s })),
    lua: level.lua.slice(),
    unlisted: level.unlisted,
  };
}

export async function createBrief(
  chart: Chart,
  updatedAt?: number
): Promise<ChartBrief> {
  const levelHashes = await Promise.all(
    chart.levels.map((level) => hashLevel(level))
  );
  const levelBrief = chart.levels.map((level, i) => ({
    name: level.name,
    type: level.type,
    hash: levelHashes[i],
    noteCount: level.notes.length,
    difficulty: difficulty(level, level.type),
    bpmMin: level.bpmChanges.map((b) => b.bpm).reduce((a, b) => Math.min(a, b)),
    bpmMax: level.bpmChanges.map((b) => b.bpm).reduce((a, b) => Math.max(a, b)),
    length:
      level.notes.length >= 1
        ? getTimeSec(level.bpmChanges, level.notes[level.notes.length - 1].step)
        : 0,
    unlisted: level.unlisted,
  }));
  return {
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    levels: levelBrief,
    updatedAt: updatedAt || 0,
    published: chart.published,
  };
}
