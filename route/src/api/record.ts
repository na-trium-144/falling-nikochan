import { Hono } from "hono";
import { cache } from "hono/cache";
import { Bindings, cacheControl } from "../env.js";
import {
  CidSchema,
  RecordGetSummary,
  RecordGetSummarySchema,
  RecordPostSchema,
} from "@falling-nikochan/chart";
import * as v from "valibot";
import { MongoClient } from "mongodb";
import { env } from "hono/adapter";
import { describeRoute, resolver, validator } from "hono-openapi";
import { errorLiteral } from "../error.js";

export interface PlayRecordEntry {
  cid: string;
  lvHash: string;
  playedAt: number;
  auto: boolean;
  score: number;
  fc: boolean;
  fb: boolean;
  factor?: number;
  editing?: boolean;
}
const recordApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .get(
    "/:cid",
    cache({
      cacheName: "api-record",
      cacheControl: "max-age=600",
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
            "Cache-Control": cacheControl(env(c), 600),
          }
        );
      } finally {
        await client.close();
      }
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
    validator("json", RecordPostSchema()),
    async (c) => {
      const { cid } = c.req.valid("param");
      const { lvHash, auto, score, fc, fb, factor, editing } =
        c.req.valid("json");

      const client = new MongoClient(env(c).MONGODB_URI);
      try {
        await client.connect();
        const db = client.db("nikochan");
        await db.collection<PlayRecordEntry>("playRecord").insertOne({
          cid,
          lvHash,
          auto,
          playedAt: Date.now(),
          score,
          fc,
          fb,
          factor: typeof factor === "number" ? factor : 1,
          editing: !!editing,
        });
        return c.body(null, 204);
      } finally {
        await client.close();
      }
    }
  );

export default recordApp;
