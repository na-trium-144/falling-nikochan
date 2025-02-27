/*
v8現在、譜面データを表す形式は以下の通り
Chart〜 は複数レベルを含むデータ、 Level〜 は単一レベルのデータ

chartFormat/ 内の定義
(Min, Edit, Play は型名にそれぞれバージョン番号がつき、legacy/ 以下にバージョンごとに定義が置かれる)

* ChartBrief: /share 内や /api/brief などで情報表示に使われる
  * Edit -> Brief: createBrief(chart)
  * EntryCompressed -> Brief: entryToBrief(chart)
* ChartMin, LevelMin: ローカル保存に使われる、情報量を失わない最小サイズの形式
  * Edit -> Min: convertToMin8(chart)
* ChartEdit, LevelEdit: 譜面の編集時と、 /api/chartFile の送受信に使われる
  * 旧バージョンからの変換: convertTo8(chart)
  * Min -> Edit: (await luaExec(level.lua.join("\n"))).levelFreezed
  * Entry -> Edit: entryToChart(chart)
* LevelPlay: /api/playFile で使われる、プレイ時の譜面データ
  * Edit -> Play: convertToPlay8(chart, lvIndex)
* ChartSeqData, Note: プレイ中の譜面データ (過去 /api/seqFile でも使われていた)
  * Play -> SeqData: loadChart8(level)

route/ 内の定義

* ChartEntry, ChartLevelCore: データベースにアクセスする際の中間形式
  * Edit -> Entry: chartToEntry(chart)
  * EntryCompressed -> Entry: unzipEntry(entry)
* ChartEntryCompressed: データベース内の形式
  * Entry -> EntryCompressed: zipEntry(entry)

*/

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
  Level8Freeze,
  Level8Min,
  Level8Play,
} from "./legacy/chart8.js";
import { luaAddBpmChange } from "./lua/bpm.js";
import { luaAddBeatChange } from "./lua/signature.js";
import { luaAddSpeedChange } from "./lua/speed.js";
import { getTimeSec } from "./seq.js";
import { validateSignature } from "./signature.js";
import { stepZero } from "./step.js";

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
export type LevelFreeze = Level8Freeze;
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
  chart = (await validateChartMin(chart)) as ChartEdit;
  chart.levels.forEach((l) => validateLevel(l));
  if (typeof chart.editPasswd !== "string") chart.editPasswd = "";
  if (typeof chart.published !== "boolean") chart.published = false;
  return chart;
}
export async function validateChartMin(
  chart:
    | ChartEdit
    | ChartMin
    | Chart1
    | Chart2
    | Chart3
    | Chart4
    | Chart5
    | Chart6
    | Chart7
): Promise<ChartEdit | ChartMin> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 8) chart = await convertTo8(chart);
  if (chart.ver !== currentChartVer) throw "chart.ver is invalid";
  if (!Array.isArray(chart.levels)) throw "chart.levels is invalid";
  chart.levels.forEach((l) => validateLevelMin(l));
  if (typeof chart.offset !== "number") chart.offset = 0;
  if (typeof chart.ytId !== "string") throw "chart.ytId is invalid";
  if (typeof chart.title !== "string") chart.title = "";
  if (typeof chart.composer !== "string") chart.composer = "";
  if (typeof chart.chartCreator !== "string") chart.chartCreator = "";
  if (typeof chart.locale !== "string") throw "chart.locale is invalid";
  return chart;
}
export function validateLevel(level: LevelEdit): LevelEdit {
  validateLevelMin(level);
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
export function validateLevelMin<L extends LevelMin>(level: L): L {
  if (typeof level.name !== "string") throw "level.name is invalid";
  if (!levelTypes.includes(level.type)) throw "level.type is invalid";
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

export function numEvents(chart: ChartEdit): number {
  return chart.levels
    .map(
      (l) =>
        l.notes.length +
        l.rest.length +
        l.bpmChanges.length +
        l.speedChanges.length +
        l.signature.length
    )
    .reduce((a, b) => a + b);
}

export function emptyChart(locale: string): ChartEdit {
  let chart: ChartEdit = {
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
    locale,
  };
  return chart;
}
// prevLevelからbpmとspeedだけはコピー
export function emptyLevel(prevLevel?: LevelEdit): LevelEdit {
  let level: LevelEdit = {
    name: "",
    type: levelTypes[0],
    lua: [],
    unlisted: false,
    notes: [],
    rest: [],
    bpmChanges: [],
    speedChanges: [],
    signature: [],
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
    level = luaAddBpmChange(level, {
      bpm: 120,
      step: stepZero(),
      timeSec: 0,
    })!;
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
export function copyLevel(level: LevelEdit): LevelEdit {
  return {
    name: level.name,
    type: level.type,
    lua: level.lua.slice(),
    unlisted: level.unlisted,
    notes: level.notes.map((n) => ({ ...n })),
    rest: level.rest.map((n) => ({ ...n })),
    bpmChanges: level.bpmChanges.map((n) => ({ ...n })),
    speedChanges: level.speedChanges.map((n) => ({ ...n })),
    signature: level.signature.map((n) => ({ ...n })),
  };
}

export async function createBrief(
  chart: ChartEdit,
  updatedAt?: number
): Promise<ChartBrief> {
  let levelHashes: string[] = [];
  try {
    levelHashes = await Promise.all(
      chart.levels.map((level) => hashLevel(level))
    );
  } catch {
    //
  }
  const levelBrief = chart.levels.map((level, i) => ({
    name: level.name,
    type: level.type,
    unlisted: level.unlisted,
    hash: levelHashes[i],
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
    updatedAt: updatedAt || 0,
    published: chart.published,
    locale: chart.locale,
  };
}
