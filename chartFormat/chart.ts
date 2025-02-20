import { updateBpmTimeSec, validateBpmChange } from "./bpm.js";
import { validateNoteCommand, validateRestStep } from "./command.js";
import { difficulty } from "./difficulty.js";
import { Chart1 } from "./legacy/chart1.js";
import { Chart2 } from "./legacy/chart2.js";
import { Chart3 } from "./legacy/chart3.js";
import { Chart4 } from "./legacy/chart4.js";
import { Chart5 } from "./legacy/chart5.js";
import { Chart6 } from "./legacy/chart6.js";
import { Chart7, hashLevel7 } from "./legacy/chart7.js";
import {
  Chart8Edit,
  Chart8Min,
  convertTo8,
  convertToMin8,
  convertToPlay8,
  Level8Edit,
  Level8Min,
  Level8Play,
} from "./legacy/chart8.js";
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
  locale: string;
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

export const currentChartVer = 8;
export const lastIncompatibleVer = 6;
export type ChartMin = Chart8Min;
export type LevelMin = Level8Min;
export type ChartEdit = Chart8Edit;
export type LevelEdit = Level8Edit;
export type LevelPlay = Level8Play;
export const convertToMin = convertToMin8;
export const convertToPlay = convertToPlay8;
export const levelTypes = ["Single", "Double", "Maniac"];

export async function validateChart(
  chart:
    | ChartEdit
    | Chart1
    | Chart2
    | Chart3
    | Chart4
    | Chart5
    | Chart6
    | Chart7
): Promise<ChartEdit> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 8) chart = await convertTo8(chart);
  if (chart.ver !== currentChartVer) throw "chart.ver is invalid";
  if (!Array.isArray(chart.levels)) throw "chart.levels is invalid";
  chart.levels.forEach((l) => validateLevelMin(l));
  chart.levelsFreezed.forEach((l) => validateLevelEdit(l));
  if (typeof chart.offset !== "number") chart.offset = 0;
  if (typeof chart.ytId !== "string") throw "chart.ytId is invalid";
  if (typeof chart.title !== "string") chart.title = "";
  if (typeof chart.composer !== "string") chart.composer = "";
  if (typeof chart.chartCreator !== "string") chart.chartCreator = "";
  if (typeof chart.editPasswd !== "string") chart.editPasswd = "";
  if (typeof chart.published !== "boolean") chart.published = false;
  if (typeof chart.locale !== "string") throw "chart.locale is invalid";
  return chart;
}
export function validateLevelMin(level: LevelMin): LevelMin {
  if (typeof level.name !== "string") throw "level.name is invalid";
  if (!levelTypes.includes(level.type)) throw "level.type is invalid";
  if (!Array.isArray(level.lua)) throw "level.lua is invalid";
  if (level.lua.filter((l) => typeof l !== "string").length > 0)
    throw "level.lua is invalid";
  if (typeof level.unlisted !== "boolean") level.unlisted = false;
  return level;
}
export function validateLevelEdit(level: LevelEdit): LevelEdit {
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

export function emptyChart(locale: string): ChartEdit {
  let chart: ChartEdit = {
    falling: "nikochan",
    ver: currentChartVer,
    levels: [emptyLevel()],
    levelsFreezed: [],
    offset: 0,
    ytId: "",
    title: "",
    composer: "",
    chartCreator: "",
    editPasswd: "",
    published: false,
    locale,
  };
  return chart;
}
// prevLevelからbpmとspeedだけはコピー
export function emptyLevel(prevLevel?: LevelEdit): LevelMin {
  let level: LevelMin = {
    name: "",
    type: levelTypes[0],
    lua: [],
    unlisted: false,
  };
  let levelEdit: LevelEdit = {
    notes: [],
    rest: [],
    bpmChanges: [],
    speedChanges: [],
    signature: [],
  };
  if (prevLevel) {
    for (const change of prevLevel.bpmChanges) {
      const res = luaAddBpmChange(levelEdit, level.lua, change);
      levelEdit = res!.chart;
      level.lua = res!.lua;
    }
    for (const change of prevLevel.speedChanges) {
      const res = luaAddSpeedChange(levelEdit, level.lua, change);
      levelEdit = res!.chart;
      level.lua = res!.lua;
    }
    for (const s of prevLevel.signature) {
      const res = luaAddBeatChange(levelEdit, level.lua, s);
      levelEdit = res!.chart;
      level.lua = res!.lua;
    }
  } else {
    const res = luaAddBpmChange(levelEdit, level.lua, {
      bpm: 120,
      step: stepZero(),
      timeSec: 0,
    });
    const res2 = luaAddSpeedChange(res!.chart, res!.lua, {
      bpm: 120,
      step: stepZero(),
      timeSec: 0,
    })!;
    const res3 = luaAddBeatChange(res2!.chart, res2!.lua, {
      step: stepZero(),
      offset: stepZero(),
      barNum: 0,
      bars: [[4, 4, 4, 4]],
    });
    levelEdit = res3!.chart;
    level.lua = res3!.lua;
  }
  return level;
}
export function copyLevel(level: LevelMin): LevelMin {
  return {
    name: level.name,
    type: level.type,
    lua: level.lua.slice(),
    unlisted: level.unlisted,
  };
}

export async function createBrief(
  chart: ChartEdit,
  updatedAt?: number
): Promise<ChartBrief> {
  let levelHashes: string[] = [];
  try {
    levelHashes = await Promise.all(
      chart.levelsFreezed.map((level) => hashLevel(level))
    );
  } catch {
    //
  }
  const levelBrief = chart.levelsFreezed.map((level, i) => ({
    name: chart.levels[i].name,
    type: chart.levels[i].type,
    unlisted: chart.levels[i].unlisted,
    hash: levelHashes[i],
    noteCount: level.notes.length,
    difficulty: difficulty(level, chart.levels[i].type),
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
    updatedAt: updatedAt || 0,
    published: chart.published,
    locale: chart.locale,
  };
}
