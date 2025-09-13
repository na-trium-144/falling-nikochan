import { Hono } from "hono";
import { Bindings } from "../env.js";
import { env } from "hono/adapter";
import { MongoClient } from "mongodb";
import { postChart } from "./twitter.js";
import { checkNewCharts } from "./latest.js";

const cronTestApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .post("/latest", async (c) => {
    checkNewCharts(env(c));
    return c.body(null, 200);
  })
  .post("/post/:cid", async (c) => {
    const cid = c.req.param("cid") || "";
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      postChart(env(c), db, cid, "new");
      return c.body(null, 200);
    } finally {
      await client.close();
    }
  });

export default cronTestApp;
