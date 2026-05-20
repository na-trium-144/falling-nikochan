import { Hono } from "hono";
import { cache } from "hono/cache";
import { entryToBrief, getChartEntryCompressed } from "./chart.js";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { CidSchema, docRefs } from "@falling-nikochan/chart";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  errorLiteral,
  sValidatorHook,
  validationErrorSchema,
} from "../error.js";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 600;

const briefApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  cache({
    cacheName: "api-brief",
    cacheControl: `max-age=${CACHE_MAX_AGE}`,
  }),
  describeRoute({
    description: "Get brief information about the chart.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: docRefs("ChartBrief"),
          },
        },
        headers: {
          "Cache-Control": {
            description: `max-age=${CACHE_MAX_AGE}`,
            schema: { type: "string" },
          },
        },
      },
      400: {
        description: "invalid chart id",
        content: {
          "application/json": {
            schema: resolver(await validationErrorSchema()),
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
  validator("param", v.object({ cid: CidSchema() }), sValidatorHook()),
  async (c) => {
    const { cid } = c.req.valid("param");
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const entry = await getChartEntryCompressed(db, cid, null);
      return c.json(entryToBrief(entry), 200, {
        "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
      });
    } finally {
      await client.close();
    }
  }
);

export default briefApp;
