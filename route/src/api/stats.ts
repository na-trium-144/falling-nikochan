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
const CACHE_MAX_AGE = 3600;

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
            schema: resolver(
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
              })
            ),
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
    const [chartCount, recordPlayCount, legacyPlayCountAgg] = await Promise.all(
      [
        db
          .collection<ChartEntryCompressed>("chart")
          .countDocuments({ deleted: false }),
        db.collection<PlayRecordEntry>("playRecord").countDocuments(),
        db
          .collection<ChartEntryCompressed>("chart")
          .aggregate<{ total: number }>([
            {
              $group: {
                _id: null,
                total: { $sum: { $ifNull: ["$playCount", 0] } },
              },
            },
          ])
          .toArray(),
      ]
    );

    const playCount = recordPlayCount + (legacyPlayCountAgg[0]?.total ?? 0);

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
