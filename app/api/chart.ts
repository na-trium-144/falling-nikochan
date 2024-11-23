import {
  Chart,
  ChartBrief,
  createBrief,
  hashPasswd,
  validateChart,
} from "@/chartFormat/chart";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import {
  BPMChangeWithLua,
  NoteCommandWithLua,
  RestStep,
  SignatureWithLua,
} from "@/chartFormat/command";
import { Binary, Db } from "mongodb";

/**
 * pをnullにするとパスワードのチェックを行わない。
 */
export async function getChartEntry(
  db: Db,
  cid: string,
  p: string | null
): Promise<{
  res?: { message: string; status: number };
  entry?: ChartEntry;
  chart?: Chart;
}> {
  const entryCompressed = (await db
    .collection("chart")
    .findOne({ cid })) as ChartEntryCompressed | null;
  if (entryCompressed === null || entryCompressed.deleted) {
    return {
      res: { message: "Chart ID Not Found", status: 404 },
    };
  }
  if (typeof entryCompressed.published !== "boolean") {
    entryCompressed.published = false;
  }

  let entry: ChartEntry;
  let chart: Chart;
  try {
    entry = await unzipEntry(entryCompressed);
    chart = entryToChart(entry);
    chart = await validateChart(chart);
  } catch (e) {
    return {
      res: { message: "invalid chart data", status: 500 },
    };
  }

  if (p === null) {
    return { entry, chart };
  }
  if (process.env.NODE_ENV === "development" && p === "bypass") {
    return { entry, chart };
  }
  if (p !== (await hashPasswd(chart.editPasswd))) {
    return { res: { message: "bad password", status: 401 } };
  }
  return { entry, chart };
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
  ver: 6;
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
  updatedAt: number;
  playCount: number;
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
export interface ChartLevelCore {
  notes: NoteCommandWithLua[];
  rest: RestStep[];
  bpmChanges: BPMChangeWithLua[];
  speedChanges: BPMChangeWithLua[];
  signature: SignatureWithLua[];
  lua: string[];
}
export type ChartEntry = ChartEntryCompressed & { levels: ChartLevelCore[] };

export async function unzipEntry(
  entry: ChartEntryCompressed
): Promise<ChartEntry> {
  if (!entry.levelsCompressed) {
    throw new Error("levelsCompressed is null");
  }
  const decodedChart = entry.levelsCompressed.buffer;
  const decompressedChart = await promisify(gunzip)(decodedChart);
  const levels: ChartLevelCore[] = JSON.parse(
    new TextDecoder().decode(decompressedChart)
  );
  return {
    ...entry,
    levelsCompressed: null,
    levels,
  };
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
    levelBrief: entry.levelBrief,
    levelsCompressed: new Binary(levelsCompressed),
  };
}

export function entryToChart(entry: ChartEntry): Chart {
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
}

export async function chartToEntry(
  chart: Chart,
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
  };
}
