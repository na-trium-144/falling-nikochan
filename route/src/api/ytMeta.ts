import { Hono } from "hono";
import { cache } from "hono/cache";
import { getChartEntryCompressed } from "./chart.js";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { CidSchema } from "@falling-nikochan/chart";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import { errorLiteral } from "../error.js";
import { getYTDataEntry } from "./ytData.js";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 86400;

const ytMetaApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  cache({
    cacheName: "api-ytMeta",
    cacheControl: `max-age=${CACHE_MAX_AGE}`,
  }),
  describeRoute({
    description: "Get YouTube metadata about the chart.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(
              v.object({
                title: v.string(),
                channelTitle: v.string(),
              })
            ),
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
  validator("query", v.object({ lang: v.string() })),
  async (c) => {
    const { cid } = c.req.valid("param");
    const { lang } = c.req.valid("query");
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const entry = await getChartEntryCompressed(db, cid, null);
      const ytId = entry.ytId;
      const ytData = await getYTDataEntry(env(c), db, ytId);
      if (ytData) {
        let title =
          // exact match
          ytData.localizations[lang]?.title ??
          // partial match
          Object.entries(ytData.localizations).find(([key]) =>
            key.startsWith(lang.split("-")[0])
          )?.[1].title ??
          // use en
          ytData.localizations["en"]?.title ??
          Object.entries(ytData.localizations).find(([key]) =>
            key.startsWith("en")
          )?.[1].title ??
          // default
          ytData.title;
        return c.json({ title, channelTitle: ytData.channelTitle }, 200, {
          "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
        });
      } else {
        // todo: better error message
        return c.json({}, 500);
      }
    } finally {
      await client.close();
    }
  }
);

export default ytMetaApp;
