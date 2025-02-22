import { Hono } from "hono";
import { entryToBrief, getChartEntry } from "./chart.js";
import { MongoClient } from "mongodb";
import { Bindings } from "../env.js";
import { env } from "hono/adapter";

const briefApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  async (c) => {
    const cid = c.req.param("cid");
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const { entry } = await getChartEntry(db, cid, null);
      return c.json(entryToBrief(entry), 200, {
        "cache-control": "max-age=600",
      });
    } finally {
      await client.close();
    }
  }
);

export default briefApp;
