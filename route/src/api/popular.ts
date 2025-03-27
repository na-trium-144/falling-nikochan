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
      });
      const cidCounts: { cid: string; count: number }[] = [];
      for await (const record of records) {
        const b = await db
          .collection<ChartEntryCompressed>("chart")
          .find({ cid: record.cid, published: true })
          .project<{
            levelBrief: ChartLevelBrief[];
          }>({ _id: 0, levelBrief: true })
          .next();
        if (b && b.levelBrief.find((l) => l.hash === record.lvHash)) {
          const cidCount = cidCounts.find((c) => c.cid === record.cid);
          if (cidCount) {
            cidCount.count++;
          } else {
            cidCounts.push({ cid: record.cid, count: 1 });
          }
        }
      }
      return c.json(
        cidCounts.sort((a, b) => b.count - a.count).slice(0, numLatest),
        200,
        {
          "cache-control": cacheControl(env(c), 600),
        },
      );
    } finally {
      await client.close();
    }
  },
);

export default popularApp;
