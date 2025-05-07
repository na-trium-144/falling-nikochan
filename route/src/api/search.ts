import { Hono } from "hono";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed } from "./chart.js";
import * as v from "valibot";
import { normalizeStr } from "./ytData.js";
import { numLatest } from "@falling-nikochan/chart";

const searchApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  async (c) => {
    const { q } = v.parse(
      v.object({
        q: v.string(),
      }),
      c.req.query(),
    );
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
                { cid: q, published: true },
                {
                  $and: [
                    ...normalizedQueries.map((s) => ({
                      normalizedText: { $regex: s },
                    })),
                    { published: true },
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
                0,
              ),
          )
          .slice(0, numLatest)
          .map((r) => ({ cid: r.cid })),
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

export default searchApp;
