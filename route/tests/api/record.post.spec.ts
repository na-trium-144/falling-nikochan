import { expect, test, describe } from "bun:test";
import { initDb } from "./init";
import app from "@falling-nikochan/route";
import { RecordPost, hash } from "@falling-nikochan/chart";
import { MongoClient } from "mongodb";
import { PlayRecordEntry } from "@falling-nikochan/route/src/api/record";

describe("POST /api/record/:cid", () => {
  test("should store record and return random player Id", async () => {
    await initDb();
    const res = await app.request("/api/record/100000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lvHash: await hash("dummy"),
        score: 100,
        fc: true,
        fb: false,
      } as RecordPost),
    });
    expect(res.status).toBe(204);
    const playerId = res.headers.get("Set-Cookie")?.split(";")[0].split("=")[1];
    console.log(playerId);
    expect(playerId).toBeString();
    expect(playerId).not.toBeEmpty();

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      const record = await (
        await client.connect()
      )
        .db("nikochan")
        .collection<PlayRecordEntry>("playRecord")
        .findOne({ $and: [{ cid: "100000" }, { playerId }] });
      expect(record).toMatchObject({
        lvHash: await hash("dummy"),
        score: 100,
        fc: 1,
        fb: 0,
        count: 1,
      });
    } finally {
      client.close();
    }
  });
  test("should use same player Id if it is set in the cookie", async () => {
    await initDb();
    const res = await app.request("/api/record/100000", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
      body: JSON.stringify({
        lvHash: await hash("dummy"),
        score: 100,
        fc: false,
        fb: true,
      } as RecordPost),
    });
    expect(res.status).toBe(204);
    const playerId = res.headers.get("Set-Cookie")?.split(";")[0].split("=")[1];
    console.log(playerId);
    expect(playerId).toBe("def");

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      const record = await (
        await client.connect()
      )
        .db("nikochan")
        .collection<PlayRecordEntry>("playRecord")
        .findOne({ $and: [{ cid: "100000" }, { playerId }] });
      expect(record).toMatchObject({
        lvHash: await hash("dummy"),
        score: 100,
        fc: 0,
        fb: 1,
        count: 1,
      });
    } finally {
      client.close();
    }
  });
  describe("update record", () => {
    test("should update count if lvHash is the same", async () => {
      await initDb();
      let res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 100,
          fc: false,
          fb: false,
        } as RecordPost),
      });
      expect(res.status).toBe(204);
      res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 100,
          fc: false,
          fb: false,
        } as RecordPost),
      });
      expect(res.status).toBe(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        const record = await (
          await client.connect()
        )
          .db("nikochan")
          .collection<PlayRecordEntry>("playRecord")
          .findOne({
            $and: [{ cid: "100000" }, { lvHash: await hash("dummy") }, { playerId: "def" }],
          });
        expect(record).toMatchObject({
          count: 2,
          fc: 0,
          fb: 0,
        });
      } finally {
        client.close();
      }
    });
    test("should update fc count if fc", async () => {
      await initDb();
      let res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 100,
          fc: true,
          fb: false,
        } as RecordPost),
      });
      expect(res.status).toBe(204);
      res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 100,
          fc: true,
          fb: false,
        } as RecordPost),
      });
      expect(res.status).toBe(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        const record = await (
          await client.connect()
        )
          .db("nikochan")
          .collection<PlayRecordEntry>("playRecord")
          .findOne({
            $and: [{ cid: "100000" }, { lvHash: await hash("dummy") }, { playerId: "def" }],
          });
        expect(record).toMatchObject({
          count: 2,
          fc: 2,
          fb: 0,
        });
      } finally {
        client.close();
      }
    });
    test("should update fb count if fb", async () => {
      await initDb();
      let res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 100,
          fc: false,
          fb: true,
        } as RecordPost),
      });
      expect(res.status).toBe(204);
      res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 100,
          fc: false,
          fb: true,
        } as RecordPost),
      });
      expect(res.status).toBe(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        const record = await (
          await client.connect()
        )
          .db("nikochan")
          .collection<PlayRecordEntry>("playRecord")
          .findOne({
            $and: [{ cid: "100000" }, { lvHash: await hash("dummy") }, { playerId: "def" }],
          });
        expect(record).toMatchObject({
          count: 2,
          fb: 2,
          fc: 0,
        });
      } finally {
        client.close();
      }
    });
    test("should update score if posted score is higher", async () => {
      await initDb();
      let res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 100,
          fc: true,
          fb: false,
        } as RecordPost),
      });
      expect(res.status).toBe(204);
      res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 110,
          fc: true,
          fb: false,
        } as RecordPost),
      });
      expect(res.status).toBe(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        const record = await (
          await client.connect()
        )
          .db("nikochan")
          .collection<PlayRecordEntry>("playRecord")
          .findOne({
            $and: [{ cid: "100000" }, { lvHash: await hash("dummy") }, { playerId: "def" }],
          });
        expect(record).toMatchObject({
          score: 110,
        });
      } finally {
        client.close();
      }
    });
    test("should not update score if posted score is lower", async () => {
      await initDb();
      let res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 100,
          fc: true,
          fb: false,
        } as RecordPost),
      });
      expect(res.status).toBe(204);
      res = await app.request("/api/record/100000", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: "playerId=def" },
        body: JSON.stringify({
          lvHash: await hash("dummy"),
          score: 80,
          fc: true,
          fb: false,
        } as RecordPost),
      });
      expect(res.status).toBe(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        const record = await (
          await client.connect()
        )
          .db("nikochan")
          .collection<PlayRecordEntry>("playRecord")
          .findOne({
            $and: [{ cid: "100000" }, { lvHash: await hash("dummy") }, { playerId: "def" }],
          });
        expect(record).toMatchObject({
          score: 100,
        });
      } finally {
        client.close();
      }
    });
  });
});
