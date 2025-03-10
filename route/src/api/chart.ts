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
  CidSchema,
  Chart9Edit,
  SpeedChange9,
  NoteCommand9,
  Rest9,
  BPMChange9,
  Signature9,
} from "@falling-nikochan/chart";
import * as v from "valibot";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { Binary, Db } from "mongodb";
import { HTTPException } from "hono/http-exception";
import { randomBytes } from "node:crypto";

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
export async function getChartEntry(
  db: Db,
  cid: string,
  p: Passwd | null,
): Promise<{
  entry: ChartEntry;
  chart: Chart4 | Chart5 | Chart6 | Chart7 | Chart8Edit | Chart9Edit;
}> {
  if (!v.parse(CidSchema(), cid)) {
    throw new HTTPException(400, { message: "invalidChartId" });
  }
  const entryCompressed = await db
    .collection<ChartEntryCompressed>("chart")
    .findOne({ cid });
  if (entryCompressed === null || entryCompressed.deleted) {
    if (process.env.API_ENV === "development" && isSample(cid)) {
      const chart = getSample(cid);
      return {
        chart,
        entry: await chartToEntry(chart, cid, 0, "", null),
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
    (p.rawPasswd !== undefined &&
      (await getPServerHash(
        cid,
        p.rawPasswd,
        p.pSecretSalt,
        entry.pRandomSalt,
      )) === entry.pServerHash) ||
    (p.v9PasswdHash !== undefined &&
      p.v9UserSalt !== undefined &&
      (await getPUserHash(entry.pServerHash, p.v9UserSalt)) === p.v9PasswdHash)
  ) {
    return { entry, chart };
  } else {
    throw new HTTPException(401, { message: "badPassword" });
  }
}

export function getPUserHash(
  pServerHash: string,
  pUserSalt: string,
): Promise<string> {
  return hash(pServerHash + pUserSalt);
}
function getPServerHash(
  cid: string,
  rawPasswd: string,
  pSecretSalt: string,
  pRandomSalt: string,
): Promise<string> {
  return hash(cid + rawPasswd + pSecretSalt + pRandomSalt);
}
/**
 * データベースに保存する形式
 *
 * levels がjson+gzip圧縮+base64エンコードされてlevelsCompressedとして保存されている
 *
 * v8->v9: need to set locale, pServerHash, pRandomSalt
 */
export interface ChartEntryCompressed {
  cid: string;
  levelsCompressed: Binary | null; // <- ChartLevelCore をjson化&gzip圧縮したもの
  deleted: boolean;
  published: boolean;
  ver: 4 | 5 | 6 | 7 | 8 | 9;
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  pServerHash: string; // see comment in chartFile.ts
  pRandomSalt: string;
  updatedAt: number;
  locale: string;
  levelBrief: {
    name: string;
    hash: string;
    type: "Single" | "Double" | "Maniac";
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
export interface ChartLevelCore9 {
  notes: NoteCommand9[];
  rest: Rest9[];
  bpmChanges: BPMChange9[];
  speedChanges: SpeedChange9[];
  signature: Signature9[];
  lua: string[];
}
export type ChartEntry = ChartEntryCompressed &
  (
    | { ver: 4; levels: ChartLevelCore3[] }
    | { ver: 5 | 6; levels: ChartLevelCore5[] }
    | { ver: 7 | 8; levels: ChartLevelCore7[] }
    | { ver: 9; levels: ChartLevelCore9[] }
  );

export async function unzipEntry(
  entry: ChartEntryCompressed,
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
  entry: ChartEntry,
): Promise<ChartEntryCompressed> {
  const levelsCompressed: Buffer = await promisify(gzip)(
    JSON.stringify(entry.levels),
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
    pServerHash: entry.pServerHash,
    pRandomSalt: entry.pRandomSalt,
    updatedAt: entry.updatedAt,
    locale: entry.locale,
    levelBrief: entry.levelBrief,
    levelsCompressed: new Binary(levelsCompressed),
  };
}

export async function chartToEntry(
  chart: ChartEdit,
  cid: string,
  updatedAt: number,
  pSecretSalt: string,
  prevEntry: ChartEntry | null,
): Promise<ChartEntry> {
  const chartBrief = await createBrief(chart, updatedAt);
  const pRandomSalt =
    prevEntry?.pRandomSalt || randomBytes(16).toString("base64");
  let pServerHash: string;
  if (prevEntry && chart.changePasswd === null) {
    pServerHash = prevEntry.pServerHash;
  } else {
    if (!chart.changePasswd) {
      throw new HTTPException(400, { message: "noPasswd" });
    }
    pServerHash = await getPServerHash(
      cid,
      chart.changePasswd,
      pSecretSalt,
      pRandomSalt,
    );
  }
  return {
    cid,
    deleted: prevEntry?.deleted || false,
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
    pServerHash,
    pRandomSalt,
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
    published: entry.published,
    locale: entry.locale || "ja",
  };
}

export function entryToChart(
  entry: ChartEntry,
): Chart4 | Chart5 | Chart6 | Chart7 | Chart8Edit | Chart9Edit {
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
    default:
      throw new HTTPException(500, { message: "unsupportedChartVersion" });
  }
}
