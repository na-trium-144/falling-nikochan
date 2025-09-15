import { Hono } from "hono";
import { entryToBrief, getChartEntryCompressed } from "./chart.js";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { CidSchema } from "@falling-nikochan/chart";
import * as v from "valibot";

const briefApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  async (c) => {
    const { cid } = v.parse(v.object({ cid: CidSchema() }), c.req.param());
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const entry = await getChartEntryCompressed(db, cid, null);
      return c.json(entryToBrief(entry), 200, {
        "cache-control": cacheControl(env(c), 600),
      });
    } finally {
      await client.close();
    }
  }
);

export default briefApp;
