import { Hono } from "hono";
import { Db, MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed, ChartLevelBrief } from "./chart.js";
import { PlayRecordEntry } from "./record.js";
import { numLatest, popularDays } from "@falling-nikochan/chart";

export interface CidCount {
  cid: string;
  count: number;
}
export async function getPopularCharts(db: Db): Promise<CidCount[]> {
  const records = db.collection<PlayRecordEntry>("playRecord").find({
    playedAt: { $gt: Date.now() - 1000 * 60 * 60 * 24 * popularDays },
    editing: { $ne: true },
  });
  const cidCounts: CidCount[] = [];
  const chartEntries = new Map<string, ChartLevelBrief[] | undefined>();
  for await (const record of records) {
    let lb: ChartLevelBrief[] | undefined;
    if (chartEntries.has(record.cid)) {
      lb = chartEntries.get(record.cid);
    } else {
      lb = (
        await db
          .collection<ChartEntryCompressed>("chart")
          .find({ cid: record.cid, published: true, deleted: false })
          .project<{
            levelBrief: ChartLevelBrief[];
          }>({ _id: 0, levelBrief: true })
          .next()
      )?.levelBrief;
      chartEntries.set(record.cid, lb);
    }
    if (lb && lb.find((l) => l.hash === record.lvHash)) {
      const factor = typeof record.factor === "number" ? record.factor : 1;
      const cidCount = cidCounts.find((c) => c.cid === record.cid);
      if (cidCount) {
        cidCount.count += factor;
      } else {
        cidCounts.push({ cid: record.cid, count: factor });
      }
    }
  }
  return cidCounts.sort((a, b) => b.count - a.count).slice(0, numLatest);
}

const popularApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  async (c) => {
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      return c.json(await getPopularCharts(db), 200, {
        "cache-control": cacheControl(env(c), 600),
      });
    } finally {
      await client.close();
    }
  }
);

export default popularApp;
