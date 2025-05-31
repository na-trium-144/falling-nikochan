import { Hono } from "hono";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed, ChartLevelBrief } from "./chart.js";
import { PlayRecordEntry } from "./record.js";
import { numLatest, popularDays } from "@falling-nikochan/chart";

const popularApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  async (c) => {
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const records = db.collection<PlayRecordEntry>("playRecord").find({
        playedAt: { $gt: Date.now() - 1000 * 60 * 60 * 24 * popularDays },
        editing: { $ne: true },
      });
      const cidCounts: { cid: string; count: number }[] = [];
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
      return c.json(
        cidCounts.sort((a, b) => b.count - a.count).slice(0, numLatest),
        200,
        {
          "cache-control": cacheControl(env(c), 600),
        }
      );
    } finally {
      await client.close();
    }
  }
);

export default popularApp;
