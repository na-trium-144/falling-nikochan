import { Hono } from "hono";
import { cache } from "hono/cache";
import { entryToBrief, getChartEntryCompressed } from "./chart.js";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartBriefSchema, CidSchema } from "@falling-nikochan/chart";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import { errorLiteral } from "../error.js";

const briefApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  cache({
    cacheName: "api-brief",
    cacheControl: "max-age=600",
  }),
  describeRoute({
    description: "Get brief information about the chart.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(ChartBriefSchema()),
          },
        },
      },
      400: {
        description: "invalid chart id",
        content: {
          "application/json": {
            schema: resolver(v.object({ message: v.string() })),
          },
        },
      },
      404: {
        description: "chart id not found",
        content: {
          "application/json": {
            schema: resolver(await errorLiteral("chartIdNotFound")),
          },
        },
      },
    },
  }),
  validator("param", v.object({ cid: CidSchema() })),
  async (c) => {
    const { cid } = c.req.valid("param");
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
