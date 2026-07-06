import { Db } from "mongodb";
import { Bindings } from "../env.js";
import moji from "moji";
import { fetchError } from "../error.js";
import { BaseLogger } from "@hono/structured-logger";

export interface YTDataEntry {
  ytId: string;
  title: string;
  description: string;
  channelTitle: string;
  tags: string[];
  localizations: Record<string, { title: string; description: string }>;
  lastFetched: number;
}

export function normalizeStr(str: string) {
  return moji(str.normalize("NFKC").toLowerCase())
    .convert("ZE", "HE")
    .convert("ZS", "HS")
    .convert("HK", "ZK")
    .convert("KK", "HG")
    .toString();
}

export function normalizeEntry(data: {
  title: string;
  composer: string;
  chartCreator: string;
  ytData?: YTDataEntry;
}) {
  return [
    normalizeStr(data.title),
    normalizeStr(data.composer),
    normalizeStr(data.chartCreator),
    data.ytData
      ? [
          normalizeStr(data.ytData.title),
          normalizeStr(data.ytData.description),
          normalizeStr(data.ytData.channelTitle),
          data.ytData.tags.map((tag) => normalizeStr(tag)),
          Object.values(data.ytData.localizations).map((data) => [
            normalizeStr(data.title),
            normalizeStr(data.description),
          ]),
        ]
      : [],
  ]
    .flat()
    .join(" ");
}

export async function getYTDataEntry(
  logger: BaseLogger,
  e: Bindings,
  db: Db,
  ytId: string
): Promise<YTDataEntry> {
  const entry = await db.collection<YTDataEntry>("ytData").findOne({ ytId });
  if (entry && entry.lastFetched > Date.now() - 24 * 60 * 60 * 1000) {
    return entry;
  } else {
    if (!e.YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY not set");
    }
    try {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/videos?" +
          new URLSearchParams({
            part: "snippet,localizations",
            id: ytId,
            key: e.YOUTUBE_API_KEY,
          })
      ).catch(fetchError(e));
      if (!res.ok) {
        throw new Error(`Failed to fetch YT data (${res.status})`, {
          cause: res,
        });
      }
      const data: any = await res.json();
      logger.info({ ytData: data });
      if (data.items.length !== 1) {
        throw new Error("items.length !== 1");
      }
      const entry: YTDataEntry = {
        ytId,
        title: data.items[0].snippet.title,
        description: data.items[0].snippet.description,
        channelTitle: data.items[0].snippet.channelTitle,
        tags: data.items[0].snippet.tags || [],
        localizations: data.items[0].localizations || {},
        lastFetched: Date.now(),
      };
      await db
        .collection<YTDataEntry>("ytData")
        .updateOne({ ytId }, { $set: entry }, { upsert: true });
      return entry;
    } catch (e: any) {
      e.ytId = ytId; // Sentryに報告されたときのために追加情報としてytIdを入れておく
      throw e;
    }
  }
}
