import {
  ChartBrief,
  ChartEdit,
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
} from "@falling-nikochan/chart";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { Binary, Db } from "mongodb";
import { HTTPException } from "hono/http-exception";

export function hashPasswd(
  cid: string,
  pw: string,
  hashKey: string
): Promise<string> {
  return hash(cid + pw + hashKey);
}

interface Passwd {
  bypass?: boolean;
  v6PasswdHash?: string;
  rawPasswd?: string;
  v7PasswdHash?: string;
  v7HashKey?: string;
}
/**
 * パスワードについては chartFile のコメントを参照
 *
 * パスワードが不要なアクセス (/api/brief など) ではpをnullにする
 */
export async function getChartEntry(
  db: Db,
  cid: string,
  p: Passwd | null
): Promise<{
  entry: ChartEntry;
  chart: Chart4 | Chart5 | Chart6 | Chart7 | Chart8Edit;
}> {
  const entryCompressed = (await db
    .collection("chart")
    .findOne({ cid })) as ChartEntryCompressed | null;
  if (entryCompressed === null || entryCompressed.deleted) {
    if (process.env.API_ENV === "development" && isSample(cid)) {
      const chart = getSample(cid);
      return {
        chart,
        entry: await chartToEntry(chart, cid, 0),
      };
    } else {
      throw new HTTPException(404, { message: "chartIdNotFound" });
    }
  }
  if (typeof entryCompressed.published !== "boolean") {
    entryCompressed.published = false;
  }

  const entry = await unzipEntry(entryCompressed);
  const chart = entryToChart(entry);

  if (
    p === null ||
    p.bypass ||
    (p.rawPasswd !== undefined && p.rawPasswd === chart.editPasswd) ||
    (p.v6PasswdHash !== undefined &&
      chart.ver <= 6 &&
      p.v6PasswdHash === (await hash(chart.editPasswd))) ||
    (p.v7PasswdHash !== undefined &&
      p.v7HashKey !== undefined &&
      p.v7PasswdHash === (await hashPasswd(cid, chart.editPasswd, p.v7HashKey)))
  ) {
    return { entry, chart };
  } else {
    throw new HTTPException(401, { message: "badPassword" });
  }
}

/**
 * データベースに保存する形式
 *
 * levels がjson+gzip圧縮+base64エンコードされてlevelsCompressedとして保存されている
 */
export interface ChartEntryCompressed {
  cid: string;
  levelsCompressed: Binary | null;
  deleted: boolean;
  published: boolean;
  ver: 4 | 5 | 6 | 7 | 8;
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
  updatedAt: number;
  playCount: number;
  locale?: string; // new in v7
  levelBrief: {
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

export type ChartEntry = ChartEntryCompressed &
  (
    | { ver: 4; levels: ChartLevelCore3[] }
    | { ver: 5 | 6; levels: ChartLevelCore5[] }
    | { ver: 7 | 8; levels: ChartLevelCore7[] }
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
    chartCreator: entry.chartCreator,
    editPasswd: entry.editPasswd,
    updatedAt: entry.updatedAt,
    playCount: entry.playCount,
    locale: entry.locale,
    levelBrief: entry.levelBrief,
    levelsCompressed: new Binary(levelsCompressed),
  };
}

export async function chartToEntry(
  chart: ChartEdit,
  cid: string,
  updatedAt: number,
  prevEntry?: ChartEntry
): Promise<ChartEntry> {
  const chartBrief = await createBrief(chart, updatedAt);
  return {
    cid,
    deleted: prevEntry?.deleted || false,
    playCount: prevEntry?.playCount || 0,
    levelsCompressed: null,
    levels: chart.levels.map((level) => ({
      notes: level.notes,
      rest: level.rest,
      bpmChanges: level.bpmChanges,
      speedChanges: level.speedChanges,
      signature: level.signature,
      lua: level.lua,
    })),
    ver: chart.ver,
    published: chart.published,
    offset: chart.offset,
    editPasswd: chart.editPasswd,
    ytId: chartBrief.ytId,
    title: chartBrief.title,
    composer: chartBrief.composer,
    chartCreator: chartBrief.chartCreator,
    updatedAt: chartBrief.updatedAt,
    levelBrief: chartBrief.levels,
    locale: chartBrief.locale,
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
    playCount: entry.playCount,
    published: entry.published,
    locale: entry.locale || "ja",
  };
}

export function entryToChart(
  entry: ChartEntry
): Chart4 | Chart5 | Chart6 | Chart7 | Chart8Edit {
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
        editPasswd: entry.editPasswd,
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
        editPasswd: entry.editPasswd,
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
        editPasswd: entry.editPasswd,
      };
    case 7:
      if (!entry.locale) {
        throw new Error("locale is required in v7");
      }
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
        editPasswd: entry.editPasswd,
        locale: entry.locale,
      };
    case 8:
      if (!entry.locale) {
        throw new Error("locale is required in v7");
      }
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
        editPasswd: entry.editPasswd,
        locale: entry.locale,
      };
    default:
      throw new HTTPException(500, { message: "unsupportedChartVersion" });
  }
}
