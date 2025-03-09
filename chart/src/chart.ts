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
import {
  Chart9Edit,
  Chart9Min,
  ChartEditSchema9,
  ChartMinSchema9,
  ChartUntil9,
  ChartUntil9Min,
  convertTo9,
  convertTo9Min,
  convertToMin9,
  convertToPlay9,
  Level9Edit,
  Level9Freeze,
  Level9Min,
  Level9Play,
} from "./legacy/chart9.js";
import { luaAddBpmChange } from "./lua/bpm.js";
import { luaAddBeatChange } from "./lua/signature.js";
import { luaAddSpeedChange } from "./lua/speed.js";
import { getTimeSec } from "./seq.js";
import { stepZero } from "./step.js";

export const YoutubeIdSchema = () => v.pipe(
  v.string(),
  v.regex(/^[a-zA-Z0-9_-]{11}$/)
);
export const HashSchema = () => v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
export const LuaLineSchema = () => v.nullable(
  v.pipe(v.number(), v.integer(), v.minValue(0))
);
export const CidSchema = () => v.pipe(v.string(), v.regex(/^[0-9]{6}$/));
export const levelTypes = ["Single", "Double", "Maniac"];
export const levelTypesConst = ["Single", "Double", "Maniac"] as const;

export const ChartBriefSchema = () => v.object({
  ytId: YoutubeIdSchema(),
  title: v.string(),
  composer: v.string(),
  chartCreator: v.string(),
  updatedAt: v.number(), // <- Date.getTime()
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

export const currentChartVer = 9;
export const lastIncompatibleVer = 6;
export type ChartMin = Chart9Min;
export type LevelMin = Level9Min;
export type ChartEdit = Chart9Edit;
export type LevelFreeze = Level9Freeze;
export type LevelEdit = Level9Edit;
export type LevelPlay = Level9Play;
export const convertToMin = convertToMin9;
export const convertToPlay = convertToPlay9;

export async function validateChart(chart: ChartUntil9): Promise<ChartEdit> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 9) chart = await convertTo9(chart);
  v.parse(ChartEditSchema9(), chart);
  return chart;
}
export async function validateChartMin(
  chart: ChartUntil9Min
): Promise<ChartEdit | ChartMin> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 9) chart = await convertTo9Min(chart);
  v.parse(ChartMinSchema9(), chart);
  return chart;
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
    changePasswd: null,
    published: false,
    locale,
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
      luaLine: null,
    })!;
    level = luaAddSpeedChange(level, {
      bpm: 120,
      step: stepZero(),
      timeSec: 0,
      luaLine: null,
    })!;
    level = luaAddBeatChange(level, {
      step: stepZero(),
      offset: stepZero(),
      barNum: 0,
      bars: [[4, 4, 4, 4]],
      luaLine: null,
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
  updatedAt: number,
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
    updatedAt: updatedAt,
    published: chart.published,
    locale: chart.locale,
  };
}
