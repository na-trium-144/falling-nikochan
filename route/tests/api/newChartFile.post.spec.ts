import { expect, test, describe } from "vitest";
import { app, dummyChart, dummyChart11, initDb } from "./init";
import { chartMaxEvent, fileMaxSize } from "@falling-nikochan/chart";
import msgpack from "@ygoe/msgpack";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";

describe("POST /api/newChartFile", () => {
  test.skipIf(
    process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT
  )("should return 429 for too many requests", async () => {
    await initDb();
    const res1 = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({
        ...dummyChart(),
        changePasswd: "p",
      }),
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({
        ...dummyChart(),
        changePasswd: "p",
      }),
    });
    expect(res2.status).toBe(429);
    const body = await res2.json();
    expect(body).toStrictEqual({ message: "tooManyRequest" });
  });
  test("should create chart and return cid", async () => {
    await initDb();
    const dateBefore = new Date();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({
        ...dummyChart(),
        changePasswd: "p",
      }),
    });
    const dateAfter = new Date();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cid).toBeTypeOf("string");

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: body.cid });
      expect(e).not.toBeNull();
      expect(e!.title).toBe(dummyChart().title);
      expect(e!.updatedAt).toBeGreaterThanOrEqual(dateBefore.getTime());
      expect(e!.updatedAt).toBeLessThanOrEqual(dateAfter.getTime());
    } finally {
      await client.close();
    }
  });
  test("should save ip address", async () => {
    await initDb();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
        "x-forwarded-for": "123",
      },
      body: msgpack.serialize({
        ...dummyChart(),
        changePasswd: "p",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: body.cid });
      expect(e).not.toBeNull();
      expect(e!.ip).toStrictEqual(["123"]);
    } finally {
      await client.close();
    }
  });
  test("should return 400 is passwd is not set", async () => {
    await initDb();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize(dummyChart()),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "noPasswd" });
  });
  test("should return 413 for large file", async () => {
    await initDb();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: new ArrayBuffer(fileMaxSize + 1),
    });
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "tooLargeFile" });
  });
  test("should return 413 for chart containing too many events", async () => {
    await initDb();
    const chart = dummyChart();
    chart.levels[0].rest = new Array(chartMaxEvent + 1).fill(
      chart.levels[0].rest[0]
    );
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize(chart),
    });
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "tooManyEvent" });
  });
  test("should return 409 for old chart version", async () => {
    await initDb();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart11() }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "oldChartVersion" });
  });
  test("should return 415 for invalid chart", async () => {
    await initDb();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      body: "invalid",
    });
    expect(res.status).toBe(415);
  });
});
