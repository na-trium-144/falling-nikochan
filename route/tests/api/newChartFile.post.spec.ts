import { test, describe } from "node:test";
import { expect } from "chai";
import {
  app,
  dummyChart,
  dummyChart12,
  dummyChart13,
  dummyChart14,
  dummyChart4,
  initDb,
} from "./init";
import {
  chartMaxEvent,
  currentChartVer,
  fileMaxSize,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";

describe("POST /api/newChartFile", () => {
  test(
    "should return 429 for too many requests",
    {
      skip:
        process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT,
    },
    async () => {
      await initDb();
      const res1 = await app.request("/api/newChartFile", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({
          ...dummyChart(),
          changePasswd: "p",
        }),
      });
      expect(res1.status).to.equal(200);

      const res2 = await app.request("/api/newChartFile", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({
          ...dummyChart(),
          changePasswd: "p",
        }),
      });
      expect(res2.status).to.equal(429);
      const body = await res2.json();
      expect(body).to.deep.equal({ message: "tooManyRequest" });
    }
  );
  test("should create chart and return cid", async () => {
    await initDb();
    const dateBefore = new Date();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode({
        ...dummyChart(),
        changePasswd: "p",
      }),
    });
    const dateAfter = new Date();
    expect(res.status).to.equal(200);
    const body = await res.json();
    expect(body.cid).to.be.a("string");

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: body.cid });
      expect(e).not.to.be.null;
      expect(e!.title).to.equal(dummyChart().title);
      expect(e!.updatedAt).to.be.at.least(dateBefore.getTime());
      expect(e!.updatedAt).to.be.at.most(dateAfter.getTime());
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
      body: msgpack.encode({
        ...dummyChart(),
        changePasswd: "p",
      }),
    });
    expect(res.status).to.equal(200);
    const body = await res.json();

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: body.cid });
      expect(e).not.to.be.null;
      expect(e!.ip).to.deep.equal(["123"]);
    } finally {
      await client.close();
    }
  });
  test("should return 400 is passwd is not set", async () => {
    await initDb();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode(dummyChart()),
    });
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "noPasswd" });
  });
  test("should return 413 for large file", async () => {
    await initDb();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: new ArrayBuffer(fileMaxSize + 1),
    });
    expect(res.status).to.equal(413);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "tooLargeFile" });
  });
  test("should return 413 for chart containing too many events", async () => {
    await initDb();
    const chart = dummyChart();
    chart.levelsFreeze[0].rest = new Array(chartMaxEvent + 1).fill(
      chart.levelsFreeze[0].rest[0]
    );
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode(chart),
    });
    expect(res.status).to.equal(413);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "tooManyEvent" });
  });
  describe("should return 409 for chart version older than 14", () => {
    currentChartVer satisfies 15; // edit this test when chart version is bumped
    test("version 13", async () => {
      await initDb();
      const res = await app.request("/api/newChartFile", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({ ...dummyChart13() }),
      });
      expect(res.status).to.equal(409);
      const body = await res.json();
      expect(body).to.deep.equal({ message: "oldChartVersion" });
    });
    test("version 12", async () => {
      await initDb();
      const res = await app.request("/api/newChartFile", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({ ...dummyChart12() }),
      });
      expect(res.status).to.equal(409);
      const body = await res.json();
      expect(body).to.deep.equal({ message: "oldChartVersion" });
    });
    test("version 4", async () => {
      await initDb();
      const res = await app.request("/api/newChartFile", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({ ...dummyChart4() }),
      });
      expect(res.status).to.equal(409);
      const body = await res.json();
      expect(body).to.deep.equal({ message: "oldChartVersion" });
    });
  });
  test("should create chart for chart version 14", async () => {
    currentChartVer satisfies 15; // edit this test when chart version is bumped
    await initDb();
    const dateBefore = new Date();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode({
        ...dummyChart14(),
        changePasswd: "p",
      }),
    });
    const dateAfter = new Date();
    expect(res.status).to.equal(200);
    const body = await res.json();
    expect(body.cid).to.be.a("string");

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: body.cid });
      expect(e).not.to.be.null;
      expect(e!.title).to.equal(dummyChart().title);
      expect(e!.updatedAt).to.be.at.least(dateBefore.getTime());
      expect(e!.updatedAt).to.be.at.most(dateAfter.getTime());
    } finally {
      await client.close();
    }
  });

  test("should return 415 for invalid chart", async () => {
    await initDb();
    const res = await app.request("/api/newChartFile", {
      method: "POST",
      body: "invalid",
    });
    expect(res.status).to.equal(415);
  });
});
