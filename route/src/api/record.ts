import { Hono } from "hono";
import { Bindings } from "../env.js";
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
        .find({ cid, auto: false });
      const summary: RecordGetSummary[] = [];
      for await (const record of records) {
        const s = summary.find((s) => s.lvHash === record.lvHash);
        if (s) {
          s.count++;
        } else {
          summary.push({ lvHash: record.lvHash, count: 1 });
        }
      }
      return c.json(summary);
    } finally {
      await client.close();
    }
  })
  .post("/:cid", async (c) => {
    const { cid } = v.parse(v.object({ cid: CidSchema() }), c.req.param());
    const { lvHash, auto, score, fc, fb } = v.parse(
      RecordPostSchema(),
      await c.req.json(),
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
      });
      return c.body(null, 204);
    } finally {
      await client.close();
    }
  });

export default recordApp;
