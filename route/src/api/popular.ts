import { Hono } from "hono";
import { cache } from "hono/cache";
import { Db, MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed, ChartLevelBrief } from "./chart.js";
import { PlayRecordEntry } from "./record.js";
import { numLatest, popularDays } from "@falling-nikochan/chart";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 600;

const CidCountSchema = v.object({
  cid: v.string(),
  count: v.number(),
});
export type CidCount = v.InferOutput<typeof CidCountSchema>;

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
  cache({
    cacheName: "api-popular",
    cacheControl: `max-age=${CACHE_MAX_AGE}`,
  }),
  describeRoute({
    description:
      `Get the list of popular charts in the last ${popularDays} days. ` +
      `Returns up to ${numLatest} charts.`,
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(v.array(CidCountSchema)),
          },
        },
      },
    },
  }),
  async (c) => {
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      return c.json(await getPopularCharts(db), 200, {
        "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
      });
    } finally {
      await client.close();
    }
  }
);

export default popularApp;
