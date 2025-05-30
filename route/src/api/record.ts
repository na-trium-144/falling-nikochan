import { Hono } from "hono";
import { Bindings, cacheControl } from "../env.js";
import {
  CidSchema,
  RecordGetSummary,
  RecordPostSchema,
} from "@falling-nikochan/chart";
import * as v from "valibot";
import { MongoClient } from "mongodb";
import { env } from "hono/adapter";

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
  .get("/:cid", async (c) => {
    const { cid } = v.parse(v.object({ cid: CidSchema() }), c.req.param());
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
  })
  .post("/:cid", async (c) => {
    const { cid } = v.parse(v.object({ cid: CidSchema() }), c.req.param());
    const { lvHash, auto, score, fc, fb, factor, editing } = v.parse(
      RecordPostSchema(),
      await c.req.json()
    );

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
  });

export default recordApp;
