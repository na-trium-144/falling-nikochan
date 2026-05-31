import { Hono } from "hono";
import { cache } from "hono/cache";
import {
  calcETag,
  entryToBrief,
  etagHeaderDoc,
  getChartEntryCompressed,
  ifNoneMatchHeaderDoc,
} from "./chart.js";
import { Db } from "mongodb";
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

const briefApp = new Hono<{
  Bindings: Bindings;
  Variables: { db: () => Promise<Db> };
}>({
  strict: false,
}).get(
  "/:cid",
  cache({
    cacheName: "api-brief",
  }),
  describeRoute({
    description: "Get brief information about the chart.",
    parameters: [ifNoneMatchHeaderDoc],
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
          ...etagHeaderDoc,
        },
      },
      304: {
        description: "No content if If-None-Match header matches",
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
    const db = await c.get("db")();
    const entry = await getChartEntryCompressed(db, cid, null);
    return c.json(entryToBrief(entry), 200, {
      "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
      "ETag": await calcETag(entry),
    });
  }
);

export async function getBrief(db: Db, cid: string) {
  const entry = await getChartEntryCompressed(db, cid, null);
  return entryToBrief(entry);
}

export default briefApp;
