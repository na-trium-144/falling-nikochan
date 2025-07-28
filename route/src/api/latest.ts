import { Hono } from "hono";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed } from "./chart.js";
import { isSample, numLatest } from "@falling-nikochan/chart";

const latestApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  async (c) => {
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      return c.json(
        (
          await db
            .collection<ChartEntryCompressed>("chart")
            .find({ published: true, deleted: false })
            .sort({ updatedAt: -1 })
            // .limit(numLatest)
            .project<{ cid: string }>({ _id: 0, cid: 1 })
            .toArray()
        ).filter((e) => !isSample(e.cid)),
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

export default latestApp;
