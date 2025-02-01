import { Hono } from "hono";
import { entryToBrief, getChartEntry } from "./chart";
import { MongoClient } from "mongodb";
import { Bindings } from "../env";

const briefApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  async (c) => {
    const cid = c.req.param("cid");
    const client = new MongoClient(c.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const { res, entry } = await getChartEntry(db, cid, null);
      if (!entry) {
        return c.json({ message: res?.message }, res?.status || 500);
      }
      return c.json({ brief: entryToBrief(entry) }, 200, {
        "cache-control": "max-age=600",
      });
    } finally {
      await client.close();
    }
  }
);

export default briefApp;
