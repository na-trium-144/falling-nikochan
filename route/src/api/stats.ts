import { Hono } from "hono";
import { cache } from "hono/cache";
import { Db } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import * as v from "valibot";
import { describeRoute, resolver } from "hono-openapi";
import { ChartEntryCompressed } from "./chart.js";
import { PlayRecordEntry } from "./record.js";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 600;

export const StatsSchema = () =>
  v.object({
    chartCount: v.pipe(
      v.number(),
      v.description(
        "Total number of charts (excluding deleted, including unpublished)"
      )
    ),
    playCount: v.pipe(
      v.number(),
      v.description("Total number of play records")
    ),
  });

export type Stats = v.InferOutput<ReturnType<typeof StatsSchema>>;

const statsApp = new Hono<{
  Bindings: Bindings;
  Variables: { db: () => Promise<Db> };
}>({
  strict: false,
}).get(
  "/",
  cache({
    cacheName: "api-stats",
  }),
  describeRoute({
    description:
      "Get overall statistics including total chart count and total play count.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(StatsSchema()),
          },
        },
        headers: {
          "Cache-Control": {
            description: `max-age=${CACHE_MAX_AGE}`,
            schema: { type: "string" },
          },
        },
      },
    },
  }),
  async (c) => {
    const db = await c.get("db")();
    const [chartCount, playCount] = await Promise.all([
      db
        .collection<ChartEntryCompressed>("chart")
        .countDocuments({ deleted: false }),
      db.collection<PlayRecordEntry>("playRecord").countDocuments(),
    ]);

    return c.json(
      {
        chartCount,
        playCount,
      },
      200,
      {
        "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
      }
    );
  }
);

export default statsApp;
