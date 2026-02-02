import { Db } from "mongodb";
import { Bindings } from "../env.js";
import moji from "moji";
import { fetchError } from "../error.js";

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
  e: Bindings,
  db: Db,
  ytId: string
): Promise<YTDataEntry | undefined> {
  const entry = await db.collection<YTDataEntry>("ytData").findOne({ ytId });
  if (entry && entry.lastFetched > Date.now() - 24 * 60 * 60 * 1000) {
    return entry;
  } else {
    if (!e.GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEY not set");
      return undefined;
    }
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/videos?" +
        new URLSearchParams({
          part: "snippet,localizations",
          id: ytId,
          key: e.GOOGLE_API_KEY,
        })
    ).catch(() => null);
    if (!res || !res.ok) {
      console.error(
        `Failed to fetch YT data for ${ytId}: ${res?.status} ${await res?.text()}`
      );
      return undefined;
    }
    try {
      const data: any = await res.json();
      console.log(data);
      if (data.items.length !== 1) {
        console.error("items.length !== 1");
        return undefined;
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
    } catch (e) {
      console.error("Failed to parse YT data", e);
      return undefined;
    }
  }
}
