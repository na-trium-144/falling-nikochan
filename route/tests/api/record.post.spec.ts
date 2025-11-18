import { expect, test, describe } from "vitest";
import { app, initDb } from "./init";
import { RecordPost, hash } from "@falling-nikochan/chart";
import { MongoClient } from "mongodb";
import { PlayRecordEntry } from "@falling-nikochan/route/src/api/record";

describe("POST /api/record/:cid", () => {
  test("should store record", async () => {
    await initDb();
    let res = await app.request("/api/record/100000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lvHash: await hash("dummy"),
        auto: false,
        score: 100,
        fc: true,
        fb: false,
        factor: 0.5,
        editing: false,
      } satisfies RecordPost),
    });
    expect(res.status).toBe(204);

    let client = new MongoClient(process.env.MONGODB_URI!);
    try {
      const record = await (
        await client.connect()
      )
        .db("nikochan")
        .collection<PlayRecordEntry>("playRecord")
        .find({ $and: [{ cid: "100000" }, { lvHash: await hash("dummy") }] })
        .toArray();
      expect(record.length).toBe(1);
      expect(record[0]).toMatchObject({
        lvHash: await hash("dummy"),
        auto: false,
        score: 100,
        fc: true,
        fb: false,
        factor: 0.5,
        editing: false,
      });
    } finally {
      client.close();
    }

    res = await app.request("/api/record/100000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lvHash: await hash("dummy"),
        auto: false,
        score: 50,
        fc: false,
        fb: true,
        factor: 0.5,
        editing: false,
      } as RecordPost),
    });
    expect(res.status).toBe(204);

    client = new MongoClient(process.env.MONGODB_URI!);
    try {
      const record = await (
        await client.connect()
      )
        .db("nikochan")
        .collection<PlayRecordEntry>("playRecord")
        .find({ $and: [{ cid: "100000" }, { lvHash: await hash("dummy") }] })
        .toArray();
      expect(record.length).toBe(2);
    } finally {
      client.close();
    }
  });
});
