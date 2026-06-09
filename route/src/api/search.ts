import { Hono } from "hono";
import { cache } from "hono/cache";
import { Db, Filter } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed, ChartLevelBrief } from "./chart.js";
import * as v from "valibot";
import { normalizeStr } from "./ytData.js";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  CidSchema,
  DifficultySchema,
  maxLv,
  minLv,
  popularDays,
} from "@falling-nikochan/chart";
import { PlayRecordEntry } from "./record.js";
import { sValidatorHook, validationErrorSchema } from "../error.js";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 600;

// Limits to prevent DoS/ReDoS attacks
const MAX_QUERY_LENGTH = 200;
const MAX_QUERY_TOKENS = 20;

// /[locale]/main/play/clientPage.tsx とあわせる
const MAX_CIDS_COUNT = 100;

/*
レスポンスで返す譜面の数には制限を設けていない。
データベース上の譜面の数がさらに増えたら、結果のpaginationの実装を検討する必要がある。 (TODO)
*/

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

const searchApp = new Hono<{
  Bindings: Bindings;
  Variables: { db: () => Promise<Db> };
}>({
  strict: false,
}).get(
  "/",
  cache({
    cacheName: "api-search",
    cacheControl: `max-age=${CACHE_MAX_AGE}`,
  }),
  describeRoute({
    description:
      "Search charts by text or get charts sorted by latest or popularity.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(v.array(SearchResultSchema())),
          },
        },
        headers: {
          "Cache-Control": {
            description: `max-age=${CACHE_MAX_AGE}`,
            schema: { type: "string" },
          },
        },
      },
      400: {
        description: "invalid parameter",
        content: {
          "application/json": {
            schema: resolver(await validationErrorSchema()),
          },
        },
      },
    },
  }),
  validator(
    "query",
    v.pipe(
      v.object({
        q: v.pipe(
          v.optional(
            v.pipe(
              v.string(),
              v.transform((s) => s.slice(0, MAX_QUERY_LENGTH))
            ),
            ""
          ),
          v.description(
            "If provided, searches by title, artist, tags, author name, or exact match of chart id. " +
              "Multiple entries separated by spaces will perform an AND search. " +
              "If not specified, returns all charts."
          )
        ),
        c: v.pipe(
          v.optional(
            v.union([
              v.pipe(
                CidSchema(),
                v.transform((c) => [c])
              ),
              v.array(CidSchema()),
            ]),
            []
          ),
          v.maxLength(MAX_CIDS_COUNT),
          v.description(
            "If chart ids are provided, the results will be filtered and returned in the specified order. " +
              `Up to ${MAX_CIDS_COUNT} chart IDs can be specified. To retrieve more, split into multiple requests.`
          )
        ),
        sort: v.pipe(
          v.optional(v.picklist(["relevance", "popular", "latest"])),
          v.description(
            "The results will be sorted by relevance to the search keyword, number of views, or update date. " +
              'If not specified, it will default to "relevance". ' +
              "Cannot be used in conjunction with the c parameter."
          )
        ),
        difficultyMin: v.pipe(
          v.optional(v.string(), String(minLv)),
          v.transform(Number),
          DifficultySchema(),
          v.description("filter charts by difficulty range")
        ),
        difficultyMax: v.pipe(
          v.optional(v.string(), String(maxLv)),
          v.transform(Number),
          DifficultySchema(),
          v.description("filter charts by difficulty range")
        ),
      }),
      v.check(
        (q) => !(q.c.length && q.sort),
        "Cannot use c and sort parameter at the same time"
      )
    ),
    sValidatorHook()
  ),
  async (c) => {
    let {
      q,
      c: cids,
      sort,
      difficultyMin,
      difficultyMax,
    } = c.req.valid("query");

    const normalizedQueries = q
      ? Array.from(
          new Set(
            normalizeStr(q)
              .split(" ")
              .map((s) => s.trim())
              .filter((s) => s)
          )
        ).slice(0, MAX_QUERY_TOKENS)
      : [];

    const db = await c.get("db")();

    const baseMongoQuery: Filter<ChartEntryCompressed>[] = [
      { deleted: false },
      {
        levelBrief: {
          $elemMatch: {
            difficulty: {
              $gte: difficultyMin,
              $lte: difficultyMax,
            },
            unlisted: { $ne: true },
          },
        },
      },
    ];
    let mongoQuery: Filter<ChartEntryCompressed>;

    if (normalizedQueries.length > 0) {
      if (cids.length) {
        // cidsが指定されている場合、publishedの状態に関わらず一致するものを返す
        mongoQuery = {
          $and: [
            ...baseMongoQuery,
            { cid: { $in: cids } },
            {
              $or: [
                { cid: q },
                {
                  $and: normalizedQueries.map((s) => ({
                    normalizedText: { $regex: escapeRegex(s) },
                  })),
                },
              ],
            },
          ],
        };
      } else {
        mongoQuery = {
          $and: [
            ...baseMongoQuery,
            {
              $or: [
                // クエリがcidに完全一致する場合は、publishedの状態に関わらず返す。これは意図的な仕様
                { cid: q },
                {
                  published: true,
                  $and: normalizedQueries.map((s) => ({
                    normalizedText: { $regex: escapeRegex(s) },
                  })),
                },
              ],
            },
          ],
        };
      }
    } else {
      if (cids.length) {
        mongoQuery = {
          $and: [...baseMongoQuery, { cid: { $in: cids } }],
        };
      } else {
        mongoQuery = {
          $and: [...baseMongoQuery, { published: true }],
        };
      }
    }

    let results = await db
      .collection<ChartEntryCompressed>("chart")
      .find(mongoQuery)
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

    if (cids.length) {
      sortedResults = cids
        .filter((qc) => results.some((r) => r.cid === qc))
        .map((qc) => ({ cid: qc }));
    } else {
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
        default:
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
    }

    return c.json(sortedResults, 200, {
      "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
    });
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
