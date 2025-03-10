import { Hono } from "hono";
import { Bindings } from "../env.js";
import { CidSchema, HashSchema } from "@falling-nikochan/chart";
import * as v from "valibot";
import { MongoClient } from "mongodb";
import { env } from "hono/adapter";
import { getCookie, setCookie } from "hono/cookie";
import { randomBytes } from "node:crypto";

export interface PlayRecordEntry {
  cid: string;
  lvHash: string;
  playerId: string;
  playedAt: number;
  score: number;
  count: number;
}
export interface RecordSummary {
  lvHash: string;
  count: number;
  // todo: scoreの統計
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
      const summary: RecordSummary[] = [];
      for await (const record of records) {
        const s = summary.find((s) => s.lvHash === record.lvHash);
        if (s) {
          s.count += record.count;
        } else {
          summary.push({ lvHash: record.lvHash, count: record.count });
        }
      }
      return c.json(summary);
    } finally {
      await client.close();
    }
  })
  .post("/:cid", async (c) => {
    const { cid } = v.parse(v.object({ cid: CidSchema() }), c.req.param());
    const { lvHash, score } = v.parse(
      v.object({
        lvHash: HashSchema(),
        score: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
      }),
      c.req.query(),
    );

    let playerId: string;
    const newPlayerId = () =>
      randomBytes(16)
        .toString("base64")
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
    if (env(c).API_ENV === "development") {
      // secure がつかない
      playerId = getCookie(c, "playerId") || newPlayerId();
      setCookie(c, "playerId", playerId, {
        // httpOnly: true,
        maxAge: 400 * 24 * 3600,
      });
    } else {
      playerId = getCookie(c, "playerId", "host") || newPlayerId();
      setCookie(c, "playerId", playerId, {
        // httpOnly: true,
        maxAge: 400 * 24 * 3600,
        path: "/",
        secure: true,
        sameSite: "Strict",
        prefix: "host",
      });
    }

    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      await db.collection<PlayRecordEntry>("playRecord").updateOne(
        { $and: [{ cid }, { lvHash }, { playerId }] },
        {
          $set: {
            cid,
            lvHash,
            playerId,
            playedAt: Date.now(),
            score,
          },
          $inc: { count: 1 },
        },
        { upsert: true },
      );
      return c.body(null, 204);
    } finally {
      await client.close();
    }
  });

export default recordApp;
