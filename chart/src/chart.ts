/*
v8現在、譜面データを表す形式は以下の通り
Chart〜 は複数レベルを含むデータ、 Level〜 は単一レベルのデータ

chartFormat/ 内の定義
(Min, Edit, Play は型名にそれぞれバージョン番号がつき、legacy/ 以下にバージョンごとに定義が置かれる)

* ChartBrief: /share 内や /api/brief などで情報表示に使われる
  * Edit -> Brief: createBrief(chart)
  * EntryCompressed -> Brief: entryToBrief(chart)
* ChartMin: ローカル保存に使われる、情報量を失わない最小サイズの形式
  * 旧バージョンからの変換: convertTo14Min(chart)
  * Edit -> Min: convertToMin14(chart)
* ChartEdit: 譜面の編集時と、 /api/chartFile の送受信に使われる
  * 旧バージョンからの変換: convertTo14(chart)
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
import { luaAddBpmChange } from "./lua/bpm.js";
import { luaAddBeatChange } from "./lua/signature.js";
import { luaAddSpeedChange } from "./lua/speed.js";
import { stepZero, stepSimplify } from "./step.js";
import { defaultCopyBuffer } from "./command.js";
import objectHash from "object-hash";
import {
  Chart13Edit,
  ChartEditSchema13,
  ChartUntil13,
  ChartUntil13Min,
  convertTo13,
  Level13Freeze,
  Level13Play,
} from "./legacy/chart13.js";
import {
  Chart14Edit,
  Chart14Min,
  ChartEditSchema14,
  ChartMinSchema14,
  ChartUntil14,
  ChartUntil14Min,
  convertTo14,
  convertTo14Min,
  convertToMin14,
  convertToPlay14,
  Level14Min,
} from "./legacy/chart14.js";
import { LevelForLuaEditLatest } from "./lua/edit.js";
import { BPMChangeWithLua, SpeedChangeWithLua } from "./bpm.js";
import { SignatureWithLua } from "./signature.js";
import { ChartUntil11 } from "./legacy/chart11.js";

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
export const currentChartVer = 14;
export const lastIncompatibleVer = 6;
export type ChartMin = Chart14Min;
export type LevelMin = Level14Min;
export type ChartEdit = Chart14Edit;
export type LevelFreeze = Level13Freeze;
export type LevelPlay = Level13Play;
export const convertToMin = convertToMin14;
export const convertToPlay = convertToPlay14;

export async function convertToLatest(chart: ChartUntil14): Promise<ChartEdit> {
  if (chart.ver !== 14) chart = await convertTo14(chart as ChartUntil13);
  return chart;
}
export async function validateChart(chart: ChartUntil14): Promise<ChartEdit> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  chart = await convertToLatest(chart);
  chart satisfies Chart14Edit;
  v.parse(ChartEditSchema14(), chart);
  return { ...chart, ver: 14 };
}
export async function validateChart13(
  chart: ChartUntil13
): Promise<Chart13Edit> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 13) chart = await convertTo13(chart as ChartUntil11);
  chart satisfies Chart13Edit;
  v.parse(ChartEditSchema13(), chart);
  return { ...chart, ver: 13 };
}
export async function validateChartMin(
  chart: ChartUntil14Min
): Promise<ChartEdit | ChartMin> {
  if (chart.falling !== "nikochan") throw "not a falling nikochan data";
  if (chart.ver !== 14) chart = await convertTo14Min(chart as ChartUntil13Min);
  chart satisfies Chart14Min;
  v.parse(ChartMinSchema14(), chart);
  return { ...chart, ver: 14 };
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
 * Normalizes all Step types to ensure fractions are in simplest form.
 * @param level Level13Edit to hash
 * @returns Promise<string> SHA-256 hash in hex format
 */
export async function hashLevel(level: LevelFreeze): Promise<string> {
  // Normalize all Step types by simplifying fractions
  const normalizedNotes = level.notes.map((note) => ({
    ...note,
    step: stepSimplify({ ...note.step }),
  }));

  const normalizedRest = level.rest.map((rest) => ({
    ...rest,
    begin: stepSimplify({ ...rest.begin }),
    duration: stepSimplify({ ...rest.duration }),
  }));

  const normalizedBpmChanges = level.bpmChanges.map((bpm) => ({
    ...bpm,
    step: stepSimplify({ ...bpm.step }),
  }));

  const normalizedSpeedChanges = level.speedChanges.map((speed) => ({
    ...speed,
    step: stepSimplify({ ...speed.step }),
  }));

  const normalizedSignature = level.signature.map((sig) => ({
    ...sig,
    step: stepSimplify({ ...sig.step }),
    offset: stepSimplify({ ...sig.offset }),
  }));

  // Use object-hash with sort option to ensure consistent ordering
  return objectHash(
    [
      normalizedNotes,
      normalizedRest,
      normalizedBpmChanges,
      normalizedSpeedChanges,
      normalizedSignature,
    ],
    { algorithm: "sha256", encoding: "hex" }
  );
}

export function numEvents(chart: Chart13Edit | ChartEdit): number {
  if (chart.ver === 13) {
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
  } else {
    return chart.levelsFreeze
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
}

export function emptyChart(locale: string): ChartEdit {
  const { min, freeze, lua } = emptyLevel();
  let chart: ChartEdit = {
    falling: "nikochan",
    ver: currentChartVer,
    levelsMin: [min],
    lua: [lua],
    levelsFreeze: [freeze],
    offset: 0,
    ytId: "",
    title: "",
    composer: "",
    chartCreator: "",
    changePasswd: null,
    published: false,
    locale,
    copyBuffer: defaultCopyBuffer(),
    zoom: 0,
  };
  return chart;
}
// prevLevelからbpmとspeedだけはコピー
export function emptyLevel(
  prevBPM?: BPMChangeWithLua[],
  prevSpeed?: SpeedChangeWithLua[],
  prevSignature?: SignatureWithLua[]
) {
  let levelMin: LevelMin = {
    name: "",
    type: levelTypesConst[0],
    unlisted: false,
    ytBegin: 0,
    ytEnd: "note",
    ytEndSec: 0,
    snapDivider: 4,
  };
  let level: LevelForLuaEditLatest = {
    notes: [],
    rest: [],
    bpmChanges: [],
    speedChanges: [],
    signature: [],
    lua: [],
  };
  if (prevBPM && prevSpeed && prevSignature) {
    for (const change of prevBPM) {
      level = luaAddBpmChange(level, change)!;
    }
    for (const change of prevSpeed) {
      level = luaAddSpeedChange(level, change)!;
    }
    for (const s of prevSignature) {
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
  return {
    min: levelMin,
    freeze: {
      notes: level.notes,
      rest: level.rest,
      bpmChanges: level.bpmChanges,
      speedChanges: level.speedChanges,
      signature: level.signature,
    } satisfies LevelFreeze,
    lua: level.lua,
  };
}

export async function createBrief(
  // API用に過去2バージョンサポート
  chart: Chart13Edit | Chart14Edit,
  updatedAt: number
): Promise<ChartBrief> {
  let levelHashes: string[] = [];
  try {
    levelHashes = await Promise.all(
      chart.ver === 13
        ? chart.levels.map((level) => hashLevel(level))
        : chart.levelsFreeze.map((level) => hashLevel(level))
    );
  } catch {
    //
  }
  const levelsMin = chart.ver === 13 ? chart.levels : chart.levelsMin;
  const levelsFreeze = chart.ver === 13 ? chart.levels : chart.levelsFreeze;
  const levelBrief = levelsMin.map((level, i) => ({
    name: level.name,
    type: level.type,
    unlisted: level.unlisted,
    hash: levelHashes[i],
    noteCount: levelsFreeze[i].notes.length,
    difficulty: difficulty(levelsFreeze[i], level.type),
    bpmMin: levelsFreeze[i].bpmChanges
      .map((b) => b.bpm)
      .reduce((a, b) => Math.min(a, b)),
    bpmMax: levelsFreeze[i].bpmChanges
      .map((b) => b.bpm)
      .reduce((a, b) => Math.max(a, b)),
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
