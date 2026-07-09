import { Hono } from "hono";
import { cache } from "hono/cache";
import { getChartEntryCompressed } from "./chart.js";
import { Db } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { CidSchema } from "@falling-nikochan/chart";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  errorLiteral,
  sValidatorHook,
  validationErrorSchema,
} from "../error.js";
import { getYTDataEntry } from "./ytData.js";
import { BaseLogger } from "@hono/structured-logger";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 86400;

const ytMetaApp = new Hono<{
  Bindings: Bindings;
  Variables: { logger: BaseLogger; db: () => Promise<Db> };
}>({
  strict: false,
}).get(
  "/:cid",
  cache({
    cacheName: "api-ytMeta",
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
  validator("query", v.object({ lang: v.string() }), sValidatorHook()),
  async (c) => {
    const { cid } = c.req.valid("param");
    const { lang } = c.req.valid("query");
    const db = await c.get("db")();
    const entry = await getChartEntryCompressed(db, cid, null);
    const ytId = entry.ytId;
    const ytData = await getYTDataEntry(c.var.logger, env(c), db, ytId);
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
  }
);

export default ytMetaApp;
