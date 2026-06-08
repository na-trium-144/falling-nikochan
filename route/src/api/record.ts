import { Context, Hono } from "hono";
import { cache } from "hono/cache";
import { Bindings, cacheControl } from "../env.js";
import {
  CidSchema,
  rateLimit,
  RecordGetSummary,
  RecordGetSummarySchema,
  RecordPostSchema,
} from "@falling-nikochan/chart";
import * as v from "valibot";
import { Db } from "mongodb";
import { env } from "hono/adapter";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  errorLiteral,
  sValidatorHook,
  validationErrorSchema,
} from "../error.js";
import { getIp, updateIp } from "./dbRateLimit.js";
import { ConnInfo } from "hono/conninfo";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 600;

export interface PlayRecordEntry {
  cid: string;
  lvHash: string;
  playedAt: number;
  auto: boolean;
  score: number;
  baseScore?: number;
  chainScore?: number;
  bigScore?: number;
  fc: boolean;
  fb: boolean;
  factor?: number;
  editing?: boolean;
}
const recordApp = async (config: {
  getConnInfo: (c: Context) => ConnInfo | null;
}) =>
  new Hono<{ Bindings: Bindings; Variables: { db: () => Promise<Db> } }>({
    strict: false,
  })
    .get(
      "/:cid",
      cache({
        cacheName: "api-record",
        cacheControl: `max-age=${CACHE_MAX_AGE}`,
      }),
      describeRoute({
        description: "Get play record summary for the chart.",
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: resolver(v.array(RecordGetSummarySchema())),
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
        const db = await c.get("db")();
        const records = db
          .collection<PlayRecordEntry>("playRecord")
          .find({ cid });
        const summary: RecordGetSummary[] = [];
        for await (const record of records) {
          let s = summary.find((s) => s.lvHash === record.lvHash);
          if (!s) {
            s = {
              lvHash: record.lvHash,
              count: 0,
              countAuto: 0,
              histogram: Array(13).fill(0),
              countFC: 0,
              countFB: 0,
            } satisfies RecordGetSummary;
            summary.push(s);
          }
          const factor = typeof record.factor === "number" ? record.factor : 1;
          if (record.auto) {
            s.countAuto += factor;
          } else {
            s.count += factor;
            s.histogram[Math.floor(record.score / 10)] += factor;
            if (record.fc) {
              s.countFC += factor;
            }
            if (record.fb) {
              s.countFB += factor;
            }
          }
        }
        return c.json(
          summary.map((s) => ({
            lvHash: s.lvHash,
            count: Math.ceil(s.count),
            countAuto: Math.ceil(s.countAuto),
            histogram: s.histogram.map((h) => Math.ceil(h)),
            countFC: Math.ceil(s.countFC),
            countFB: Math.ceil(s.countFB),
          })),
          200,
          {
            "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
          }
        );
      }
    )
    .post(
      "/:cid",
      describeRoute({
        description: "Post a play record for a single play of the chart.",
        responses: {
          204: {
            description: "No content for successful response",
          },
          400: {
            description: "invalid chart id or body",
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
          429: {
            description: "Rate limited",
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("tooManyRequest")),
              },
            },
          },
        },
      }),
      validator("param", v.object({ cid: CidSchema() }), sValidatorHook()),
      validator("json", RecordPostSchema(), sValidatorHook()),
      async (c) => {
        const { cid } = c.req.valid("param");
        const {
          lvHash,
          auto,
          score,
          baseScore,
          chainScore,
          bigScore,
          fc,
          fb,
          factor,
          editing,
        } = c.req.valid("json");

        const ip = getIp(c, config.getConnInfo);
        const db = await c.get("db")();

        if (!(await updateIp(env(c), db, ip, "record"))) {
          return c.json(
            {
              message: "tooManyRequest",
            },
            429,
            { "retry-after": rateLimit.record.toString() }
          );
        }

        await db.collection<PlayRecordEntry>("playRecord").insertOne({
          cid,
          lvHash,
          auto,
          playedAt: Date.now(),
          score,
          baseScore,
          chainScore,
          bigScore,
          fc,
          fb,
          factor: typeof factor === "number" ? factor : 1,
          editing: !!editing,
        });
        return c.body(null, 204);
      }
    );

export default recordApp;
