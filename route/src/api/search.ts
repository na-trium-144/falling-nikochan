import { Hono } from "hono";
import { cache } from "hono/cache";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed } from "./chart.js";
import * as v from "valibot";
import { normalizeStr } from "./ytData.js";
import { describeRoute, resolver, validator } from "hono-openapi";

const searchApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  cache({
    cacheName: "api-search",
    cacheControl: "max-age=600",
  }),
  describeRoute({
    description:
      "Search charts by text in the title, artist, tags, and author name. " +
      "Multiple words are treated as AND condition. " +
      "The search is case-insensitive and ignores spaces and special characters.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(v.array(v.object({ cid: v.string() }))),
          },
        },
      },
    },
  }),
  validator("query", v.object({ q: v.string() })),
  async (c) => {
    const { q } = c.req.valid("query");
    const normalizedQueries = normalizeStr(q)
      .split(" ")
      .map((s) => s.trim())
      .filter((s) => s);
    if (normalizedQueries.length === 0) {
      return c.json([], 200, {
        "cache-control": cacheControl(env(c), 600),
      });
    }
    console.log(normalizedQueries);
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      return c.json(
        (
          await db
            .collection<ChartEntryCompressed>("chart")
            .find({
              $or: [
                { cid: q, published: true, deleted: false },
                {
                  $and: [
                    ...normalizedQueries.map((s) => ({
                      normalizedText: { $regex: s },
                    })),
                    { published: true },
                    { deleted: false },
                  ],
                },
              ],
            })
            // .sort({ updatedAt: -1 })
            // .limit(numLatest)
            .project<{ cid: string; normalizedText: string }>({
              _id: 0,
              cid: 1,
              normalizedText: 1,
            })
            .toArray()
        )
          .sort(
            (a, b) =>
              // sort by the number of queries occurence in the normalizedText
              -normalizedQueries.reduce(
                (prev, q) =>
                  prev +
                  a.normalizedText.split(q).length -
                  b.normalizedText.split(q).length,
                0
              )
          )
          .map((r) => ({ cid: r.cid })),
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

export default searchApp;
