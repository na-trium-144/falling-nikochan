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
import { ChartUntil9, ChartUntil9Min, Level9Min } from "./legacy/chart9.js";
import { luaAddBpmChange } from "./lua/bpm.js";
import { luaAddBeatChange } from "./lua/signature.js";
import { luaAddSpeedChange } from "./lua/speed.js";
import { luaReplaceYTBegin, luaReplaceYTEnd } from "./lua/yt.js";
import { getTimeSec } from "./seq.js";
import { stepZero } from "./step.js";
import {
  Chart11Edit,
  Chart11Min,
  ChartEditSchema11,
  ChartMinSchema11,
  ChartUntil11,
  ChartUntil11Min,
  convertTo11,
  convertTo11Min,
  convertToMin11,
  convertToPlay11,
  Level11Edit,
  Level11Freeze,
  Level11Play,
} from "./legacy/chart11.js";

export const YoutubeIdSchema = () =>
  v.pipe(
    v.string(),
    v.regex(/^[a-zA-Z0-9_-]{11}$/, "YouTube video id must be 11 characters"),
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
      }),
    ),
  });
export type ChartBrief = v.InferOutput<ReturnType<typeof ChartBriefSchema>>;

export const currentChartVer = 11;
export const lastIncompatibleVer = 6;
export type ChartMin = Chart11Min;
export type LevelMin = Level9Min;
export type ChartEdit = Chart11Edit;
export type LevelFreeze = Level11Freeze;
export type LevelEdit = Level11Edit;
export type LevelPlay = Level11Play;
export const convertToMin = convertToMin11;
export const convertToPlay = convertToPlay11;

export async function validateChart(chart: ChartUntil11): Promise<ChartEdit> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 11) chart = await convertTo11(chart as ChartUntil9);
  v.parse(ChartEditSchema11(), chart);
  return { ...chart, ver: 11 };
}
export async function validateChartMin(
  chart: ChartUntil11Min,
): Promise<ChartEdit | ChartMin> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 11) chart = await convertTo11Min(chart as ChartUntil9Min);
  v.parse(ChartMinSchema11(), chart);
  return { ...chart, ver: 11 };
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
        l.signature.length,
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
    ytBegin: {
      timeSec: 0,
      luaLine: null,
    },
    ytEnd: {
      timeSec: "note",
      luaLine: null,
    },
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
    level = luaReplaceYTBegin(level, prevLevel.ytBegin)!;
    level = luaReplaceYTEnd(level, prevLevel.ytEnd)!;
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
    level = luaReplaceYTBegin(level, {
      timeSec: 0,
      luaLine: null,
    })!;
    level = luaReplaceYTEnd(level, {
      timeSec: "note",
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
    ytBegin: { ...level.ytBegin },
    ytEnd: { ...level.ytEnd },
  };
}

export async function createBrief(
  chart: ChartEdit,
  updatedAt: number,
): Promise<ChartBrief> {
  let levelHashes: string[] = [];
  try {
    levelHashes = await Promise.all(
      chart.levels.map((level) => hashLevel(level)),
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
