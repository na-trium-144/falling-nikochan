/*
v8現在、譜面データを表す形式は以下の通り
Chart〜 は複数レベルを含むデータ、 Level〜 は単一レベルのデータ

chartFormat/ 内の定義
(Min, Edit, Play は型名にそれぞれバージョン番号がつき、legacy/ 以下にバージョンごとに定義が置かれる)

* ChartBrief: /share 内や /api/brief などで情報表示に使われる
  * Edit -> Brief: createBrief(chart)
  * EntryCompressed -> Brief: entryToBrief(chart)
* ChartMin, LevelMin: ローカル保存に使われる、情報量を失わない最小サイズの形式
  * Edit -> Min: convertToMin9(chart)
* ChartEdit, LevelEdit: 譜面の編集時と、 /api/chartFile の送受信に使われる
  * 旧バージョンからの変換: convertTo9(chart)
  * Min -> Edit: (await luaExec(level.lua.join("\n"))).levelFreezed
  * Entry -> Edit: entryToChart(chart)
* LevelPlay: /api/playFile で使われる、プレイ時の譜面データ
  * Edit -> Play: convertToPlay9(chart, lvIndex)
* ChartSeqData, Note: プレイ中の譜面データ (過去 /api/seqFile でも使われていた)
  * Play -> SeqData: loadChart9(level)

route/ 内の定義

* ChartEntry, ChartLevelCore: データベースにアクセスする際の中間形式
  * Edit -> Entry: chartToEntry(chart)
  * EntryCompressed -> Entry: unzipEntry(entry)
* ChartEntryCompressed: データベース内の形式
  * Entry -> EntryCompressed: zipEntry(entry)

*/

import * as v from "valibot";
import { difficulty } from "./difficulty.js";
import { hashLevel7 } from "./legacy/chart7.js";
import { luaAddBpmChange } from "./lua/bpm.js";
import { luaAddBeatChange } from "./lua/signature.js";
import { luaAddSpeedChange } from "./lua/speed.js";
import { stepZero } from "./step.js";
import { ChartUntil11, ChartUntil11Min, Level11Min } from "./legacy/chart11.js";
import { defaultCopyBuffer } from "./command.js";
import objectHash from "object-hash";
import {
  Chart13Edit,
  Chart13Min,
  ChartEditSchema13,
  ChartMinSchema13,
  ChartUntil13,
  ChartUntil13Min,
  convertTo13,
  convertTo13Min,
  convertToMin13,
  convertToPlay13,
  Level13Edit,
  Level13Freeze,
  Level13Play,
} from "./legacy/chart13.js";

export const YoutubeIdSchema = () =>
  v.pipe(
    v.string(),
    v.regex(/^[a-zA-Z0-9_-]{11}$/, "YouTube video id must be 11 characters")
  );
export const HashSchema = () => v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
export const LuaLineSchema = () =>
  v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0)));
export const CidSchema = () =>
  v.pipe(v.string(), v.regex(/^[0-9]{6}$/, "cid must be 6 digits"));
export const levelTypes = ["Single", "Double", "Maniac"];
export const levelTypesConst = ["Single", "Double", "Maniac"] as const;

export const ChartBriefSchema = () =>
  v.object({
    ytId: YoutubeIdSchema(),
    title: v.string(),
    composer: v.string(),
    chartCreator: v.string(),
    updatedAt: v.pipe(v.number(), v.description("value from Date.getTime()")),
    published: v.boolean(),
    locale: v.string(),
    levels: v.array(
      v.object({
        name: v.string(),
        hash: HashSchema(),
        type: v.picklist(levelTypesConst),
        difficulty: v.pipe(v.number(), v.integer(), v.minValue(1)),
        noteCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
        bpmMin: v.pipe(v.number(), v.gtValue(0)),
        bpmMax: v.pipe(v.number(), v.gtValue(0)),
        length: v.pipe(v.number(), v.minValue(0)),
        unlisted: v.boolean(),
      })
    ),
  });
export type ChartBrief = v.InferOutput<ReturnType<typeof ChartBriefSchema>>;

export function emptyBrief(): ChartBrief {
  return {
    ytId: "",
    title: "",
    composer: "",
    chartCreator: "",
    updatedAt: 0,
    published: false,
    locale: "",
    levels: [],
  };
}
export const currentChartVer = 13;
export const lastIncompatibleVer = 6;
export const lastHashChangeVer = 12;
export type ChartMin = Chart13Min;
export type LevelMin = Level11Min;
export type ChartEdit = Chart13Edit;
export type LevelFreeze = Level13Freeze;
export type LevelEdit = Level13Edit;
export type LevelPlay = Level13Play;
export const convertToMin = convertToMin13;
export const convertToPlay = convertToPlay13;

export async function validateChart(chart: ChartUntil13): Promise<ChartEdit> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 13) chart = await convertTo13(chart as ChartUntil11);
  chart satisfies Chart13Edit;
  v.parse(ChartEditSchema13(), chart);
  return { ...chart, ver: 13 };
}
export async function validateChartMin(
  chart: ChartUntil13Min
): Promise<ChartEdit | ChartMin> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 13) chart = await convertTo13Min(chart as ChartUntil11Min);
  chart satisfies Chart13Min;
  v.parse(ChartMinSchema13(), chart);
  return { ...chart, ver: 13 };
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

/**
 * Calculates hash of a level using object-hash library.
 * This ensures consistent hashing regardless of property order.
 * @param level Level13Edit to hash
 * @returns Promise<string> SHA-256 hash in hex format
 */
export async function hashLevel(level: Level13Edit): Promise<string> {
  // Use object-hash with sort option to ensure consistent ordering
  return objectHash(
    [level.notes, level.bpmChanges, level.speedChanges, level.signature],
    { algorithm: "sha256", encoding: "hex" }
  );
}

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
    changePasswd: null,
    published: false,
    locale,
    copyBuffer: defaultCopyBuffer(),
  };
  return chart;
}
// prevLevelからbpmとspeedだけはコピー
export function emptyLevel(prevLevel?: LevelEdit): LevelEdit {
  let level: LevelEdit = {
    name: "",
    type: levelTypesConst[0],
    lua: [],
    unlisted: false,
    notes: [],
    rest: [],
    bpmChanges: [],
    speedChanges: [],
    signature: [],
    ytBegin: 0,
    ytEnd: "note",
    ytEndSec: 0,
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
    ytBegin: level.ytBegin,
    ytEnd: level.ytEnd,
    ytEndSec: level.ytEndSec,
  };
}

export async function createBrief(
  chart: ChartEdit,
  updatedAt: number
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
    length: level.ytEndSec - level.ytBegin,
  }));
  return {
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    levels: levelBrief,
    updatedAt: updatedAt,
    published: chart.published,
    locale: chart.locale,
  };
}
