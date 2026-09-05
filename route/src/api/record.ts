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
import { verifySessionPubKey } from "./playSession.js";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

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
        parameters: [
          {
            name: "Authorization",
            in: "header",
            description: "`Bearer (JWT returned from /api/playSession/init)`.",
            schema: { type: "string" },
          },
        ],
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
      // validator("json", RecordPostSchema(), sValidatorHook()),
      async (c) => {
        const sessionPubKey = await verifySessionPubKey(
          env(c),
          c.req.header("Authorization")
        );

        const { cid } = c.req.valid("param");

        let payload: object;
        try {
          payload = (await verify(
            await c.req.text(),
            sessionPubKey,
            "ES256"
          )) as Record<string, unknown>;
        } catch {
          throw new HTTPException(400, { message: "TODO" });
        }

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
          date,
        } = v.parse(RecordPostSchema(), payload);

        if (
          Math.abs(date.getTime() - Date.now()) >
          1000 * 60 * 5 // 5 min
        ) {
          throw new HTTPException(422, { message: "TODO" });
        }

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
          playedAt: date,
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
