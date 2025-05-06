import { Hono } from "hono";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed } from "./chart.js";
import { numLatest } from "@falling-nikochan/chart";
import * as v from "valibot";
import { normalizeStr } from "./ytData.js";

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
    console.log(normalizedQueries);
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      return c.json(
        await db
          .collection<ChartEntryCompressed>("chart")
          .find({
            $or: [
              { cid: q },
              {
                $and: normalizedQueries.map((s) => ({
                  normalizedText: { $regex: s },
                })),
              },
            ],
          })
          .sort({ updatedAt: -1 })
          .limit(numLatest)
          .project<{ cid: string }>({ _id: 0, cid: 1 })
          .toArray(),
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
