import { expect, test, describe } from "bun:test";
import { dummyChart, dummyChart7, dummyCid, dummyDate, initDb } from "./init";
import app from "@falling-nikochan/route";
import { chartMaxEvent, fileMaxSize, hash } from "@falling-nikochan/chart";
import msgpack from "@ygoe/msgpack";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";

describe("POST /api/chartFile/:cid", () => {
  test("should update chart if raw password matches", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?pw=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).toBe(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = (await db
        .collection("chart")
        .findOne({ cid: dummyCid })) as ChartEntryCompressed | null;
      expect(e).not.toBeNull();
      expect(e!.title).toBe("updated");
    } finally {
      await client.close();
    }
  });
  test("should update chart if password hash matches", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100000?ph=" + (await hash("100000pdef")),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.msgpack",
          Cookie: "hashKey=def",
        },
        body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
      }
    );
    expect(res.status).toBe(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = (await db
        .collection("chart")
        .findOne({ cid: dummyCid })) as ChartEntryCompressed | null;
      expect(e).not.toBeNull();
      expect(e!.title).toBe("updated");
    } finally {
      await client.close();
    }
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000a?pw=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "invalidChartId" });
  });
  test("should return 401 for wrong password", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?pw=wrong&ph=wrong", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "badPassword" });
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100001?pw=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "chartIdNotFound" });
  });
  test("should return 413 for large file", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?pw=p", {
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
    const res = await app.request("/api/chartFile/100000?pw=p", {
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
    const res = await app.request("/api/chartFile/100000?pw=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart7() }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "oldChartVersion" });
  });
  test("should return 415 for invalid chart", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?pw=p", {
      method: "POST",
      body: "invalid",
    });
    expect(res.status).toBe(415);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "invalidChart" });
  });
  test("should not update the date of chart with uploading same chart", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?pw=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize(dummyChart()),
    });
    expect(res.status).toBe(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = (await db
        .collection("chart")
        .findOne({ cid: dummyCid })) as ChartEntryCompressed | null;
      expect(e).not.toBeNull();
      expect(e!.updatedAt).toBe(dummyDate.getTime());
    } finally {
      await client.close();
    }
  });
  test("should not update the date of chart with metadata change", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?pw=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).toBe(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = (await db
        .collection("chart")
        .findOne({ cid: dummyCid })) as ChartEntryCompressed | null;
      expect(e).not.toBeNull();
      expect(e!.updatedAt).toBe(dummyDate.getTime());
    } finally {
      await client.close();
    }
  });
  test("should update the date of chart with level change", async () => {
    await initDb();
    const chart = dummyChart();
    chart.levels[0].notes = new Array(10).fill(chart.levels[0].notes[0]);
    const dateBefore = new Date();
    const res = await app.request("/api/chartFile/100000?pw=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize(chart),
    });
    const dateAfter = new Date();
    expect(res.status).toBe(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = (await db
        .collection("chart")
        .findOne({ cid: dummyCid })) as ChartEntryCompressed | null;
      expect(e).not.toBeNull();
      expect(e!.updatedAt).toBeGreaterThanOrEqual(dateBefore.getTime());
      expect(e!.updatedAt).toBeLessThanOrEqual(dateAfter.getTime());
    } finally {
      await client.close();
    }
  });
  test("should update the date of chart with publish", async () => {
    await initDb();
    const dateBefore = new Date();
    const res = await app.request("/api/chartFile/100000?pw=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), published: true }),
    });
    const dateAfter = new Date();
    expect(res.status).toBe(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = (await db
        .collection("chart")
        .findOne({ cid: dummyCid })) as ChartEntryCompressed | null;
      expect(e).not.toBeNull();
      expect(e!.updatedAt).toBeGreaterThanOrEqual(dateBefore.getTime());
      expect(e!.updatedAt).toBeLessThanOrEqual(dateAfter.getTime());
    } finally {
      await client.close();
    }
  });
});
