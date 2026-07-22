import { Hono } from "hono";
import { cache } from "hono/cache";
import { calcETag, ChartEntryCompressed, entryToBrief } from "./chart.js";
import { Db } from "mongodb";
import { backendOrigin, Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ArrayDoc, CidSchema, docRefs } from "@falling-nikochan/chart";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import { sValidatorHook, validationErrorSchema } from "../error.js";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 600;

const MAX_CIDS_COUNT = 100;

const Response200Doc = async () => {
  const Response200Schema = () =>
    v.object({
      cid: CidSchema(),
      status: v.literal(200),
      response: v.any(), // replaced with ChartBrief in the doc definition below
      etag: v.string(),
    });
  const schema = (await resolver(Response200Schema()).toOpenAPISchema()).schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      response: docRefs("ChartBrief"),
    },
  };
};
const Response404Doc = async () => {
  const Response404Schema = () =>
    v.object({
      cid: CidSchema(),
      status: v.literal(404),
    });
  return (await resolver(Response404Schema()).toOpenAPISchema()).schema;
};

const briefMultiApp = async () =>
  new Hono<{
    Bindings: Bindings;
    Variables: { db: () => Promise<Db> };
  }>({
    strict: false,
  }).get(
    "/",
    cache({
      cacheName: "api-briefs",
    }),
    describeRoute({
      description: "Get brief information about multiple charts.",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: ArrayDoc(await Response200Doc()),
            },
          },
          headers: {
            "Cache-Control": {
              description: `max-age=${CACHE_MAX_AGE}`,
              schema: { type: "string" },
            },
          },
        },
        207: {
          description: "One or multiple chart ids not found",
          content: {
            "application/json": {
              schema: ArrayDoc({
                anyOf: [await Response200Doc(), await Response404Doc()],
              }),
            },
          },
          headers: {
            "Cache-Control": {
              description: `no-cache`,
              schema: { type: "string" },
            },
          },
        },
        308: {
          description: "Chart ids are duplicated or not sorted",
          headers: {
            "Location": {
              description: "/api/briefs?c=(sorted cids)",
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
      },
    }),
    validator(
      "query",
      v.pipe(
        v.object({
          c: v.pipe(
            v.union([
              v.pipe(
                CidSchema(),
                v.transform((c) => [c])
              ),
              v.array(CidSchema()),
            ]),
            v.maxLength(MAX_CIDS_COUNT),
            v.description(
              `Up to ${MAX_CIDS_COUNT} chart IDs can be specified. To retrieve more, split into multiple requests.`
            )
          ),
        })
      ),
      sValidatorHook()
    ),
    async (c) => {
      const { c: cids } = c.req.valid("query");

      // キャッシュを効かせるためにcidの並び順を正規化し重複を削除
      const sortedCids = [...new Set(cids)].sort();
      if (
        cids.length !== sortedCids.length ||
        cids.some((cid, i) => cid !== sortedCids[i])
      ) {
        return c.redirect(
          new URL(
            c.req.path +
              "?" +
              new URLSearchParams(
                sortedCids.map((cid) => ["c", cid] as [string, string])
              ).toString(),
            backendOrigin(c)
          ),
          308
        );
      }

      const db = await c.get("db")();
      const dbEntries = await db
        .collection<ChartEntryCompressed>("chart")
        .find({ cid: { $in: cids }, deleted: false })
        .toArray();
      const entries = await Promise.all(
        cids.map(async (cid) => {
          const entry = dbEntries.find((e) => e.cid === cid);
          if (entry) {
            return {
              cid: entry.cid,
              status: 200 as const,
              etag: await calcETag(entry),
              response: entryToBrief(entry),
            };
          } else {
            return { cid, status: 404 as const };
          }
        })
      );

      if (entries.every((e) => e.status === 200)) {
        return c.json(entries, 200, {
          "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
        });
      } else {
        return c.json(entries, 207, {
          "cache-control": "no-cache",
        });
      }
    }
  );

export default briefMultiApp;
