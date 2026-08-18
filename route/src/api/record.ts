import { Context, Hono } from "hono";
import { cache } from "hono/cache";
import { Bindings, cacheControl } from "../env.js";
import {
  bigScoreRate,
  chainScoreRate,
  CidSchema,
  deserializeDate4,
  importPrivateKey,
  importPublicKey,
  rateLimit,
  RecordGetSummary,
  RecordGetSummarySchema,
  RecordPostResponseSchema,
  RecordPostSchema,
  signData,
  verifyData,
} from "@falling-nikochan/chart";
import * as v from "valibot";
import * as msgpack from "@msgpack/msgpack";
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
import { verify } from "hono/jwt";

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
        responses: {
          200: {
            description: "Successful response with Key A signature",
            content: {
              "application/json": {
                schema: resolver(RecordPostResponseSchema()),
              },
            },
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
        const { result, sign, lvHash, factor, editing } = c.req.valid("json");

        const e = env(c);

        // 1. Verify token from Authorization header (sessionPublicKey signed with ResultSecret)
        const authHeader = c.req.header("Authorization");
        const token = authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;
        if (!token) {
          return c.json({ message: "badRequest" }, 400);
        }

        const resultSecretPub = await importPublicKey(
          e.RESULT_SECRET_PUBLIC_KEY!
        );
        let payload: Record<string, unknown>;
        try {
          payload = await verify(token, resultSecretPub, "ES256");
        } catch {
          return c.json({ message: "badRequest" }, 400);
        }

        const sessionPublicKey = payload.sessionPublicKey as string | undefined;
        if (!sessionPublicKey || typeof sessionPublicKey !== "string") {
          return c.json({ message: "badRequest" }, 400);
        }

        // 2. Verify sign on msgpack.encode(result) using sessionPublicKey
        const sessionPubKey = await importPublicKey(sessionPublicKey);
        const resultBytes = msgpack.encode(result);
        const isSessionSignValid = await verifyData(
          sessionPubKey,
          sign,
          resultBytes
        );
        if (!isSessionSignValid) {
          return c.json({ message: "badRequest" }, 400);
        }

        // 3. Verify result version and timestamp
        if (result[0] !== 4 || result[1] === null) {
          return c.json({ message: "badRequest" }, 400);
        }
        const recordDate = deserializeDate4(result[1]);
        const now = Date.now();
        // Allow up to 15 minutes clock skew / play duration window
        if (Math.abs(now - recordDate.getTime()) > 15 * 60 * 1000) {
          return c.json({ message: "badRequest" }, 400);
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

        const baseScore100 = result[5];
        const chainScore100 = result[6];
        const bigScore100 = result[7];
        const score100 = result[8];
        const playbackRate4 = result[12];
        const auto = result[13];

        // Save to DB only when played at normal speed (playbackRate === 1)
        if (playbackRate4 === 4) {
          await db.collection<PlayRecordEntry>("playRecord").insertOne({
            cid,
            lvHash,
            auto,
            playedAt: now,
            score: score100 / 100,
            baseScore: baseScore100 / 100,
            chainScore: chainScore100 / 100,
            bigScore: bigScore100 / 100,
            fc: chainScore100 === chainScoreRate * 100,
            fb: bigScore100 === bigScoreRate * 100,
            factor: typeof factor === "number" ? factor : 1,
            editing: !!editing,
          });
        }

        // 4. Sign resultBytes with ResultSecret (only for non-auto play)
        let signResult: string | null = null;
        if (!auto) {
          const resultSecretPriv = await importPrivateKey(
            e.RESULT_SECRET_PRIVATE_KEY!
          );
          signResult = await signData(resultSecretPriv, resultBytes);
        }

        return c.json({ sign: signResult }, 200);
      }
    );

export default recordApp;
