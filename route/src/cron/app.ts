import { Hono } from "hono";
import { Bindings } from "../env.js";
import { postTwitter } from "./twitter.js";
import { env } from "hono/adapter";
import { MongoClient } from "mongodb";
import { entryToBrief, getChartEntry } from "../api/chart.js";

const cronTestApp = new Hono<{ Bindings: Bindings }>({ strict: false }).post(
  "/post",
  async (c) => {
    const cid = c.req.query("cid") || "";
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const { entry } = await getChartEntry(db, cid, null);
      postTwitter(env(c), cid, entryToBrief(entry));
      return c.body(null, 200);
    } finally {
      await client.close();
    }
  }
);

export default cronTestApp;
