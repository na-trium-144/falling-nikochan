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
import { getCookie, setCookie } from "hono/cookie";
import { randomBytes } from "node:crypto";

export interface PlayRecordEntry {
  cid: string;
  lvHash: string;
  playerId: string;
  playedAt: number;
  score: number;
  fc: number;
  fb: number;
  count: number;
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
    const { lvHash, score, fc, fb } = v.parse(
      RecordPostSchema(),
      await c.req.json(),
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
          },
          $max: {
            score,
          },
          $inc: {
            count: 1,
            fc: fc ? 1 : 0,
            fb: fb ? 1 : 0,
          },
        },
        { upsert: true },
      );
      return c.body(null, 204);
    } finally {
      await client.close();
    }
  });

export default recordApp;
