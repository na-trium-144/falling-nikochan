import { Hono } from "hono";
import { Bindings } from "../env.js";
import { env } from "hono/adapter";
import { MongoClient } from "mongodb";
import { postChart } from "./twitter.js";
import { checkNewCharts } from "./latest.js";
import { timeout } from "hono/timeout";
import { reportToDiscord } from "./discord.js";
import { entryToBrief, getChartEntryCompressed } from "../api/chart.js";
import { reportPopularCharts } from "./popular.js";

const cronTestApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .use("/*", timeout(255000))
  .post("/latest", async (c) => {
    await checkNewCharts(env(c));
    return c.body(null, 200);
  })
  .post("/popular", async (c) => {
    await reportPopularCharts(env(c));
    return c.body(null, 200);
  })
  .post("/discord", async (c) => {
    const message = await c.req.text();
    if (typeof message === "string" && message.length > 0) {
      await reportToDiscord(env(c), message);
      return c.body(null, 200);
    } else {
      return c.body("Bad Request", 400);
    }
  })
  .post("/post/:cid", async (c) => {
    const cid = c.req.param("cid") || "";
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const entry = await getChartEntryCompressed(db, cid, null);
      const brief = entryToBrief(entry);
      await postChart(env(c), cid, brief, "new");
      return c.body(null, 200);
    } finally {
      await client.close();
    }
  });

export default cronTestApp;
