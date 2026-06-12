import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyChart, dummyDate, initDb } from "./init";
import { ChartBrief, hashLevel } from "@falling-nikochan/chart";
import {
  calcETag,
  getChartEntryCompressed,
} from "@falling-nikochan/route/src/api/chart";
import { MongoClient } from "mongodb";

describe("GET /api/brief/:cid", () => {
  test("should return a brief entry", async () => {
    await initDb();
    const res = await app.request("/api/brief/100000");
    expect(res.status).to.equal(200);
    const entry: ChartBrief = await res.json();
    expect(entry).to.deep.equal({
      ytId: dummyChart().ytId,
      title: dummyChart().title,
      composer: dummyChart().composer,
      chartCreator: dummyChart().chartCreator,
      updatedAt: dummyDate.getTime(),
      published: true,
      locale: dummyChart().locale,
      levels: [
        {
          name: "e",
          hash: await hashLevel(dummyChart().levelsFreeze[0]),
          type: "Single",
          difficulty: 1,
          noteCount: 1,
          bpmMin: 120,
          bpmMax: 180,
          length: 1.23,
          unlisted: false,
        },
      ],
    });
  });
  test("should return ETag calculated by calcETag()", async () => {
    await initDb();
    const res = await app.request("/api/brief/100000");
    expect(res.status).to.equal(200);
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const entry = await getChartEntryCompressed(db, "100000", null);
      expect(res.headers.get("etag")).to.equal(await calcETag(entry));
    } finally {
      await client.close();
    }
  });
  test("should return 304 for matching If-None-Match", async () => {
    await initDb();
    const res1 = await app.request("/api/brief/100000");
    expect(res1.status).to.equal(200);
    const etag = res1.headers.get("etag");
    expect(etag).to.be.a("string");

    const res2 = await app.request("/api/brief/100000", {
      headers: { "If-None-Match": etag! },
    });
    expect(res2.status).to.equal(304);
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/brief/100002");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 404 for deleted cid", async () => {
    await initDb();
    const res = await app.request("/api/brief/100001");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/brief/invalid");
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.equal("badRequest");
    expect(body.flattened.nested.cid[0]).to.be.a("string");
  });
});
