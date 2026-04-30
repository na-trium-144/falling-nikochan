import { Hono } from "hono";
import { cache } from "hono/cache";
import { Db, Filter, MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed, ChartLevelBrief } from "./chart.js";
import * as v from "valibot";
import { normalizeStr } from "./ytData.js";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  DifficultySchema,
  maxLv,
  minLv,
  popularDays,
} from "@falling-nikochan/chart";
import { PlayRecordEntry } from "./record.js";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 600;

// Limits to prevent DoS/ReDoS attacks
const MAX_QUERY_LENGTH = 200;
const MAX_QUERY_TOKENS = 10;
const MAX_SEARCH_RESULTS = 200;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SearchResultSchema = () =>
  v.object({
    cid: v.string(),
    count: v.optional(
      v.pipe(
        v.number(),
        v.description(
          "Popularity score, only present when sorted by popularity"
        )
      )
    ),
    updatedAt: v.optional(
      v.pipe(
        v.number(),
        v.description(
          "Timestamp of the latest update, only present when sorted by latest"
        )
      )
    ),
  });

const searchApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  cache({
    cacheName: "api-search",
    cacheControl: `max-age=${CACHE_MAX_AGE}`,
  }),
  describeRoute({
    description:
      "Search charts by text or get charts sorted by latest or popularity. " +
      "If q is provided, searches by title, artist, tags, and author name. " +
      "Otherwise, returns all charts. " +
      "Sort order can be 'relevance', 'popular', or 'latest'. " +
      "Optional difficultyMin and difficultyMax can be used to filter charts by difficulty range.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(v.array(SearchResultSchema())),
          },
        },
      },
    },
  }),
  validator(
    "query",
    v.object({
      q: v.optional(v.pipe(v.string(), v.maxLength(MAX_QUERY_LENGTH)), ""),
      sort: v.optional(
        v.picklist(["relevance", "popular", "latest"]),
        "relevance"
      ),
      difficultyMin: v.pipe(
        v.optional(v.string(), String(minLv)),
        v.transform(Number),
        DifficultySchema()
      ),
      difficultyMax: v.pipe(
        v.optional(v.string(), String(maxLv)),
        v.transform(Number),
        DifficultySchema()
      ),
    })
  ),
  async (c) => {
    let { q, sort, difficultyMin, difficultyMax } = c.req.valid("query");

    const normalizedQueries = q
      ? normalizeStr(q)
          .split(" ")
          .map((s) => s.trim())
          .filter((s) => s)
          .slice(0, MAX_QUERY_TOKENS)
      : [];

    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");

      let mongoQuery: Filter<ChartEntryCompressed> = {
        deleted: false,
        levelBrief: {
          $elemMatch: {
            difficulty: {
              $gte: difficultyMin,
              $lte: difficultyMax,
            },
            unlisted: { $ne: true },
          },
        },
      };

      if (normalizedQueries.length > 0) {
        mongoQuery = {
          ...mongoQuery,
          $or: [
            { cid: q },
            {
              published: true,
              $and: normalizedQueries.map((s) => ({
                normalizedText: { $regex: escapeRegex(s) },
              })),
            },
          ],
        };
      } else {
        mongoQuery = {
          ...mongoQuery,
          published: true,
        };
      }

      let results = await db
        .collection<ChartEntryCompressed>("chart")
        .find(mongoQuery)
        .limit(MAX_SEARCH_RESULTS)
        .project<{
          cid: string;
          normalizedText: string;
          updatedAt: number;
          levelBrief: ChartLevelBrief[];
        }>({
          _id: 0,
          cid: 1,
          normalizedText: 1,
          updatedAt: 1,
          levelBrief: 1,
        })
        .toArray();

      let sortedResults: v.InferOutput<ReturnType<typeof SearchResultSchema>>[];

      switch (sort) {
        case "popular": {
          const rawPopularCounts = await getRawPopularCounts(db);
          const mapped = results
            .map((r) => ({
              cid: r.cid,
              updatedAt: r.updatedAt,
              count: aggeratePopularCounts(rawPopularCounts, r),
            }))
            .filter((r) => r.count > 0 || q) // If q is empty, only return those with at least one records
            .sort((a, b) => b.count - a.count || b.updatedAt - a.updatedAt);

          sortedResults = mapped.map((r) => ({ cid: r.cid, count: r.count }));
          break;
        }
        case "latest":
          sortedResults = results
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((r) => ({ cid: r.cid, updatedAt: r.updatedAt }));
          break;
        case "relevance":
          sortedResults = results
            .sort(
              (a, b) =>
                -normalizedQueries.reduce(
                  (prev, token) =>
                    prev +
                    a.normalizedText.split(token).length -
                    b.normalizedText.split(token).length,
                  0
                ) || b.updatedAt - a.updatedAt
            )
            .map((r) => ({ cid: r.cid }));
          break;
      }

      return c.json(sortedResults, 200, {
        "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
      });
    } finally {
      await client.close();
    }
  }
);

export type RawPopularCount = {
  cid: string;
  lvHash: string;
  count: number;
};

export async function getRawPopularCounts(db: Db): Promise<RawPopularCount[]> {
  return await db
    .collection<PlayRecordEntry>("playRecord")
    .aggregate<RawPopularCount>([
      {
        $match: {
          playedAt: { $gt: Date.now() - 1000 * 60 * 60 * 24 * popularDays },
          editing: { $ne: true },
        },
      },
      {
        $group: {
          _id: { cid: "$cid", lvHash: "$lvHash" },
          count: { $sum: { $ifNull: ["$factor", 1] } },
        },
      },
      {
        $project: {
          _id: 0,
          cid: "$_id.cid",
          lvHash: "$_id.lvHash",
          count: 1,
        },
      },
    ])
    .toArray();
}

export function aggeratePopularCounts(
  raw: RawPopularCount[],
  r: { cid: string; levelBrief: ChartLevelBrief[] }
) {
  const rcs = raw.filter((rc) => rc.cid === r.cid);
  let score = 0;
  for (const rc of rcs) {
    const l = r.levelBrief.find((l) => l.hash === rc.lvHash);
    if (l) {
      // 曲の長さに応じて重み付けの上限を制限。 2min => 1, 1min => 0.7, 30s => 0.5, 10s => 0.3
      const lengthFactor = Math.max(0.3, Math.sqrt(l.length / 120));
      score += rc.count * lengthFactor;
    }
  }
  return score;
}

export default searchApp;
