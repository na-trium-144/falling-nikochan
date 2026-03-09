import {
  ChartBrief,
  createBrief,
  hash,
  BPMChangeWithLua3,
  NoteCommandWithLua3,
  RestStep3,
  Chart5,
  SignatureWithLua5,
  Chart7,
  NoteCommandWithLua7,
  Chart6,
  Chart4,
  isSample,
  getSample,
  Chart8Edit,
  CidSchema,
  Chart9Edit,
  SpeedChange9,
  NoteCommand9,
  Rest9,
  BPMChange9,
  Signature9,
  Chart11Edit,
  SpeedChangeWithLua13,
  Chart13Edit,
  Chart14Edit,
  Chart15,
  stepZero,
  CopyBuffer,
  NoteCommandWithLua15,
  RestWithLua15,
  BPMChangeWithLua15,
  SpeedChangeWithLua15,
  SignatureWithLua15,
} from "@falling-nikochan/chart";
import * as v from "valibot";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { Binary, Db } from "mongodb";
import { HTTPException } from "hono/http-exception";
import { randomBytes } from "node:crypto";
import { normalizeEntry, YTDataEntry } from "./ytData.js";

interface Passwd {
  bypass?: boolean;
  rawPasswd?: string;
  v9PasswdHash?: string;
  v9UserSalt?: string;
  pSecretSalt: string;
}
/**
 * パスワードについては chartFile のコメントを参照
 *
 * パスワードが不要なアクセス (/api/brief など) ではpをnullにする
 */
export async function getChartEntryCompressed(
  db: Db,
  cid: string,
  p: Passwd | null
): Promise<ChartEntryCompressed> {
  if (!v.parse(CidSchema(), cid)) {
    throw new HTTPException(400, { message: "invalidChartId" });
  }
  const entryCompressed = await db
    .collection<ChartEntryCompressed>("chart")
    .findOne({ cid, deleted: false });
  if (entryCompressed === null) {
    if (process.env.API_ENV === "development" && isSample(cid)) {
      const chart = getSample(cid);
      return zipEntry(
        await chartToEntry(
          { ...chart, changePasswd: "a" },
          cid,
          0,
          null,
          undefined,
          "",
          null
        )
      );
    } else {
      throw new HTTPException(404, { message: "chartIdNotFound" });
    }
  }
  if (typeof entryCompressed.published !== "boolean") {
    entryCompressed.published = false;
  }

  if (
    p === null ||
    p.bypass ||
    (entryCompressed.pServerHash === null &&
      entryCompressed.pRandomSalt === null) ||
    (entryCompressed.pServerHash !== null &&
      entryCompressed.pRandomSalt !== null &&
      ((p.rawPasswd !== undefined &&
        (await getPServerHash(
          cid,
          p.rawPasswd,
          p.pSecretSalt,
          entryCompressed.pRandomSalt
        )) === entryCompressed.pServerHash) ||
        (p.v9PasswdHash !== undefined &&
          p.v9UserSalt !== undefined &&
          (await getPUserHash(entryCompressed.pServerHash, p.v9UserSalt)) ===
            p.v9PasswdHash)))
  ) {
    return entryCompressed;
  } else {
    throw new HTTPException(401, { message: "badPassword" });
  }
}
export async function getChartEntry(
  db: Db,
  cid: string,
  p: Passwd | null
): Promise<{
  entry: ChartEntry;
  chart:
    | Chart4
    | Chart5
    | Chart6
    | Chart7
    | Chart8Edit
    | Chart9Edit
    | Chart11Edit
    | Chart13Edit
    | Chart14Edit
    | Chart15;
}> {
  const entryCompressed = await getChartEntryCompressed(db, cid, p);

  const entry = await unzipEntry(entryCompressed);
  const chart = entryToChart(entry);

  return { entry, chart };
}

export function getPUserHash(
  pServerHash: string,
  pUserSalt: string
): Promise<string> {
  return hash(pServerHash + pUserSalt);
}
export function getPServerHash(
  cid: string,
  rawPasswd: string,
  pSecretSalt: string,
  pRandomSalt: string
): Promise<string> {
  return hash(cid + rawPasswd + pSecretSalt + pRandomSalt);
}
/**
 * データベースに保存する形式
 *
 * levels がjson+gzip圧縮+base64エンコードされてlevelsCompressedとして保存されている
 */
export interface ChartEntryCompressed {
  cid: string;
  levelsCompressed: Binary | null; // <- ChartLevelCore をjson化&gzip圧縮したもの
  deleted: boolean;
  published: boolean;
  ver: 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  normalizedText: string;
  pServerHash: string | null; // see comment in chartFile.ts
  pRandomSalt: string | null;
  updatedAt: number;
  notifiedAt?: number; // 最後にcronで通知した時刻
  ip: string[];
  locale: string;
  copyBuffer?: (NoteCommand9 | null)[];
  zoom?: number;
  levelBrief: ChartLevelBrief[];
}
export interface ChartLevelBrief {
  name: string;
  hash: string;
  type: "Single" | "Double" | "Maniac";
  difficulty: number;
  noteCount: number;
  bpmMin: number;
  bpmMax: number;
  length: number;
  unlisted: boolean;
}
export interface ChartLevelCore3 {
  notes: NoteCommandWithLua3[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  lua: string[];
}
export interface ChartLevelCore5 {
  notes: NoteCommandWithLua3[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  signature: SignatureWithLua5[];
  lua: string[];
}
export interface ChartLevelCore7 {
  notes: NoteCommandWithLua7[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  signature: SignatureWithLua5[];
  lua: string[];
}
export interface ChartLevelCore9 {
  notes: NoteCommand9[];
  rest: Rest9[];
  bpmChanges: BPMChange9[];
  speedChanges: SpeedChange9[];
  signature: Signature9[];
  lua: string[];
}
export interface ChartLevelCore11 {
  notes: NoteCommand9[];
  rest: Rest9[];
  bpmChanges: BPMChange9[];
  speedChanges: SpeedChange9[];
  signature: Signature9[];
  lua: string[];
  ytBegin: number;
  ytEndSec: number;
  ytEnd: "note" | "yt" | number;
}
export interface ChartLevelCore13 {
  notes: NoteCommand9[];
  rest: Rest9[];
  bpmChanges: BPMChange9[];
  speedChanges: SpeedChangeWithLua13[];
  signature: Signature9[];
  lua: string[];
  ytBegin: number;
  ytEndSec: number;
  ytEnd: "note" | "yt" | number;
}
export interface ChartLevelCore14 {
  notes: NoteCommand9[];
  rest: Rest9[];
  bpmChanges: BPMChange9[];
  speedChanges: SpeedChangeWithLua13[];
  signature: Signature9[];
  lua: string[];
  ytBegin: number;
  ytEndSec: number;
  ytEnd: "note" | "yt" | number;
  snapDivider: number;
}
export interface ChartLevelCore15 {
  notes: NoteCommandWithLua15[];
  rest: RestWithLua15[];
  bpmChanges: BPMChangeWithLua15[];
  speedChanges: SpeedChangeWithLua15[];
  signature: SignatureWithLua15[];
  lua: string[];
  ytBegin: number;
  ytEndSec: number;
  ytEnd: "note" | "yt" | number;
  snapDivider: number;
}
export type ChartEntry = ChartEntryCompressed &
  (
    | { ver: 4; levels: ChartLevelCore3[] }
    | { ver: 5 | 6; levels: ChartLevelCore5[] }
    | { ver: 7 | 8; levels: ChartLevelCore7[] }
    | { ver: 9 | 10; levels: ChartLevelCore9[] }
    | { ver: 11 | 12; levels: ChartLevelCore11[] }
    | { ver: 13; levels: ChartLevelCore13[] }
    | { ver: 14; levels: ChartLevelCore14[] }
    | { ver: 15; levels: ChartLevelCore15[] }
  );

export async function unzipEntry(
  entry: ChartEntryCompressed
): Promise<ChartEntry> {
  if (!entry.levelsCompressed) {
    throw new Error("levelsCompressed is null");
  }
  const decodedChart = entry.levelsCompressed.buffer;
  const decompressedChart = await promisify(gunzip)(decodedChart);
  const levels = JSON.parse(new TextDecoder().decode(decompressedChart));
  return {
    ...entry,
    levelsCompressed: null,
    levels,
  } as ChartEntry;
}

export async function zipEntry(
  entry: ChartEntry
): Promise<ChartEntryCompressed> {
  const levelsCompressed: Buffer = await promisify(gzip)(
    JSON.stringify(entry.levels)
  );
  return {
    cid: entry.cid,
    deleted: entry.deleted,
    published: entry.published,
    ver: entry.ver,
    offset: entry.offset,
    ytId: entry.ytId,
    title: entry.title,
    composer: entry.composer,
    normalizedText: entry.normalizedText, // ver12〜
    chartCreator: entry.chartCreator,
    pServerHash: entry.pServerHash,
    pRandomSalt: entry.pRandomSalt,
    updatedAt: entry.updatedAt,
    ip: entry.ip,
    locale: entry.locale,
    copyBuffer: entry.copyBuffer, // ver11〜
    zoom: entry.zoom, // ver14〜
    levelBrief: entry.levelBrief,
    levelsCompressed: new Binary(levelsCompressed),
  };
}

export async function chartToEntry(
  // 過去2バージョンまで
  chart: Chart14Edit | Chart15,
  cid: string,
  updatedAt: number,
  addIp: string | null,
  ytData: YTDataEntry | undefined,
  pSecretSalt: string,
  prevEntry: ChartEntry | null,
  newHashes: string[] | null = null
): Promise<ChartEntry> {
  const chartBrief = await createBrief(chart, updatedAt);
  if (newHashes) {
    chartBrief.levels.forEach((levelBrief, index) => {
      levelBrief.hash = newHashes[index];
    });
  }
  const pRandomSalt =
    prevEntry?.pRandomSalt || randomBytes(16).toString("base64");
  let pServerHash: string;
  if (
    prevEntry &&
    prevEntry.pServerHash !== null &&
    chart.changePasswd === null
  ) {
    pServerHash = prevEntry.pServerHash;
  } else {
    if (!chart.changePasswd) {
      throw new HTTPException(400, { message: "noPasswd" });
    }
    pServerHash = await getPServerHash(
      cid,
      chart.changePasswd,
      pSecretSalt,
      pRandomSalt
    );
  }
  const ip = prevEntry?.ip || [];
  if (addIp !== null && !ip.includes(addIp)) {
    ip.push(addIp);
  }
  const levelsMin = "levelsMin" in chart ? chart.levelsMin : chart.levelsMeta;
  const levelsFreeze = chart.levelsFreeze;
  const lua = chart.lua;
  // @ts-expect-error ChartLevelCore14 | ChartLevelCore15 だが、この書き方だとfreezeとverの対応関係を正しく推論できない
  return {
    cid,
    deleted: prevEntry?.deleted || false,
    levelsCompressed: null,
    levels: levelsMin.map((_, i) => ({
      notes: levelsFreeze[i].notes,
      rest: levelsFreeze[i].rest,
      bpmChanges: levelsFreeze[i].bpmChanges,
      speedChanges: levelsFreeze[i].speedChanges,
      signature: levelsFreeze[i].signature,
      lua: lua[i],
      ytBegin: levelsMin[i].ytBegin,
      ytEndSec: levelsMin[i].ytEndSec,
      ytEnd: levelsMin[i].ytEnd,
      snapDivider: "snapDivider" in levelsMin[i] ? levelsMin[i].snapDivider : 4,
    })),
    ver: chart.ver,
    published: chart.published,
    offset: chart.offset,
    pServerHash,
    pRandomSalt,
    ytId: chartBrief.ytId,
    title: chartBrief.title,
    composer: chartBrief.composer,
    chartCreator: chartBrief.chartCreator,
    normalizedText: normalizeEntry({ ...chartBrief, ytData }),
    updatedAt: chartBrief.updatedAt,
    levelBrief: chartBrief.levels,
    ip,
    locale: chartBrief.locale,
    copyBuffer: Array.isArray(chart.copyBuffer)
      ? chart.copyBuffer
      : Array.from(new Array(10)).map((_, i) =>
          (chart.copyBuffer as CopyBuffer)[String(i)]
            ? {
                hitX: (chart.copyBuffer as CopyBuffer)[String(i)]![0],
                hitVX: (chart.copyBuffer as CopyBuffer)[String(i)]![1],
                hitVY: (chart.copyBuffer as CopyBuffer)[String(i)]![2],
                big: (chart.copyBuffer as CopyBuffer)[String(i)]![3],
                fall: (chart.copyBuffer as CopyBuffer)[String(i)]![4],
                step: stepZero(),
                luaLine: null,
              }
            : null
        ),
    zoom: chart.zoom,
  };
}
export function entryToBrief(entry: ChartEntryCompressed): ChartBrief {
  return {
    ytId: entry.ytId,
    title: entry.title,
    composer: entry.composer,
    chartCreator: entry.chartCreator,
    levels: entry.levelBrief,
    updatedAt: entry.updatedAt,
    published: entry.published,
    locale: entry.locale || "ja",
  };
}

export function entryToChart(
  entry: ChartEntry
):
  | Chart4
  | Chart5
  | Chart6
  | Chart7
  | Chart8Edit
  | Chart9Edit
  | Chart11Edit
  | Chart13Edit
  | Chart14Edit
  | Chart15 {
  switch (entry.ver) {
    case 4:
      return {
        falling: "nikochan",
        ver: entry.ver,
        levels: entry.levels.map((level, i) => ({
          name: entry.levelBrief.at(i)?.name || "",
          hash: entry.levelBrief.at(i)?.hash || "",
          type: entry.levelBrief.at(i)?.type || "",
          unlisted: entry.levelBrief.at(i)?.unlisted || false,
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          lua: level.lua,
        })),
        offset: entry.offset,
        ytId: entry.ytId,
        title: entry.title,
        composer: entry.composer,
        chartCreator: entry.chartCreator,
        editPasswd: "",
        updatedAt: entry.updatedAt,
      };
    case 5:
      return {
        falling: "nikochan",
        ver: entry.ver,
        levels: entry.levels.map((level, i) => ({
          name: entry.levelBrief.at(i)?.name || "",
          hash: entry.levelBrief.at(i)?.hash || "",
          type: entry.levelBrief.at(i)?.type || "",
          unlisted: entry.levelBrief.at(i)?.unlisted || false,
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          signature: level.signature,
          lua: level.lua,
        })),
        offset: entry.offset,
        ytId: entry.ytId,
        title: entry.title,
        composer: entry.composer,
        chartCreator: entry.chartCreator,
        editPasswd: "",
        updatedAt: entry.updatedAt,
      };
    case 6:
      return {
        falling: "nikochan",
        ver: entry.ver,
        published: entry.published,
        levels: entry.levels.map((level, i) => ({
          name: entry.levelBrief.at(i)?.name || "",
          type: entry.levelBrief.at(i)?.type || "",
          unlisted: entry.levelBrief.at(i)?.unlisted || false,
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          signature: level.signature,
          lua: level.lua,
        })),
        offset: entry.offset,
        ytId: entry.ytId,
        title: entry.title,
        composer: entry.composer,
        chartCreator: entry.chartCreator,
        editPasswd: "",
      };
    case 7:
      return {
        falling: "nikochan",
        ver: entry.ver,
        published: entry.published,
        levels: entry.levels.map((level, i) => ({
          name: entry.levelBrief.at(i)?.name || "",
          type: entry.levelBrief.at(i)?.type || "",
          unlisted: entry.levelBrief.at(i)?.unlisted || false,
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          signature: level.signature,
          lua: level.lua,
        })),
        offset: entry.offset,
        ytId: entry.ytId,
        title: entry.title,
        composer: entry.composer,
        chartCreator: entry.chartCreator,
        editPasswd: "",
        locale: entry.locale,
      };
    case 8:
      return {
        falling: "nikochan",
        ver: entry.ver,
        published: entry.published,
        levels: entry.levels.map((level, i) => ({
          name: entry.levelBrief.at(i)?.name || "",
          type: entry.levelBrief.at(i)?.type || "",
          unlisted: entry.levelBrief.at(i)?.unlisted || false,
          lua: level.lua,
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          signature: level.signature,
        })),
        offset: entry.offset,
        ytId: entry.ytId,
        title: entry.title,
        composer: entry.composer,
        chartCreator: entry.chartCreator,
        editPasswd: "",
        locale: entry.locale,
      };
    case 9:
    case 10:
      return {
        falling: "nikochan",
        ver: entry.ver,
        published: entry.published,
        levels: entry.levels.map((level, i) => ({
          name: entry.levelBrief.at(i)?.name || "",
          type: entry.levelBrief.at(i)?.type || "Maniac",
          unlisted: entry.levelBrief.at(i)?.unlisted || false,
          lua: level.lua,
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          signature: level.signature,
        })),
        offset: entry.offset,
        ytId: entry.ytId,
        title: entry.title,
        composer: entry.composer,
        chartCreator: entry.chartCreator,
        changePasswd: null,
        locale: entry.locale,
      };
    case 11:
    case 12:
    case 13:
      return {
        falling: "nikochan",
        ver: entry.ver,
        published: entry.published,
        levels: entry.levels.map((level, i) => ({
          name: entry.levelBrief.at(i)?.name || "",
          type: entry.levelBrief.at(i)?.type || "Maniac",
          unlisted: entry.levelBrief.at(i)?.unlisted || false,
          lua: level.lua,
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          signature: level.signature,
          ytBegin: level.ytBegin,
          ytEndSec: level.ytEndSec,
          ytEnd: level.ytEnd,
        })),
        offset: entry.offset,
        ytId: entry.ytId,
        title: entry.title,
        composer: entry.composer,
        chartCreator: entry.chartCreator,
        changePasswd: null,
        locale: entry.locale,
        copyBuffer: entry.copyBuffer!,
      } as Chart11Edit | Chart13Edit;
    case 14:
      return {
        falling: "nikochan",
        ver: entry.ver,
        published: entry.published,
        levelsMin: entry.levels.map((level, i) => ({
          name: entry.levelBrief.at(i)?.name || "",
          type: entry.levelBrief.at(i)?.type || "Maniac",
          unlisted: entry.levelBrief.at(i)?.unlisted || false,
          ytBegin: level.ytBegin,
          ytEndSec: level.ytEndSec,
          ytEnd: level.ytEnd,
          snapDivider: level.snapDivider || 4,
        })),
        levelsFreeze: entry.levels.map((level) => ({
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          signature: level.signature,
        })),
        lua: entry.levels.map((level) => level.lua),
        offset: entry.offset,
        ytId: entry.ytId,
        title: entry.title,
        composer: entry.composer,
        chartCreator: entry.chartCreator,
        changePasswd: null,
        locale: entry.locale,
        copyBuffer: entry.copyBuffer!,
        zoom: entry.zoom || 0,
      } as Chart14Edit;
    case 15:
      return {
        falling: "nikochan",
        ver: entry.ver,
        published: entry.published,
        levelsMeta: entry.levels.map((level, i) => ({
          name: entry.levelBrief.at(i)?.name || "",
          type: entry.levelBrief.at(i)?.type || "Maniac",
          unlisted: entry.levelBrief.at(i)?.unlisted || false,
          ytBegin: level.ytBegin,
          ytEndSec: level.ytEndSec,
          ytEnd: level.ytEnd,
          snapDivider: level.snapDivider || 4,
        })),
        levelsFreeze: entry.levels.map((level) => ({
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          signature: level.signature,
        })),
        lua: entry.levels.map((level) => level.lua),
        offset: entry.offset,
        ytId: entry.ytId,
        title: entry.title,
        composer: entry.composer,
        chartCreator: entry.chartCreator,
        changePasswd: null,
        locale: entry.locale,
        copyBuffer: Object.fromEntries(
          entry
            .copyBuffer!.map((entry, i) => [
              String(i),
              entry
                ? [entry.hitX, entry.hitVX, entry.hitVY, entry.big, entry.fall]
                : undefined,
            ])
            .filter(([, value]) => value !== undefined)
        ),
        zoom: entry.zoom || 0,
      } as Chart15;
    default:
      entry satisfies never;
      throw new HTTPException(500, { message: "unsupportedChartVersion" });
  }
}
