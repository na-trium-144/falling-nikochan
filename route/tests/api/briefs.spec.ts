import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyChart, dummyDate, initDb } from "./init.js";
import { ChartBrief, hashLevel } from "@falling-nikochan/chart";
import {
  calcETag,
  getChartEntryCompressed,
} from "@falling-nikochan/route/src/api/chart";
import { MongoClient } from "mongodb";

describe("GET /api/briefs", () => {
  test("should return brief entries for valid cids", async () => {
    await initDb();
    const cid1 = "100000";
    const cid2 = "100004";
    const res = await app.request(`/api/briefs?c=${cid1}&c=${cid2}`);
    expect(res.status).to.equal(200);
    expect(res.headers.get("cache-control")).to.include("max-age=");

    const entries = await res.json();
    expect(entries).to.be.an("array").with.lengthOf(2);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const dbEntry1 = await getChartEntryCompressed(db, cid1, null);
      const dbEntry2 = await getChartEntryCompressed(db, cid2, null);

      expect(entries[0]).to.deep.equal({
        cid: cid1,
        status: 200,
        etag: await calcETag(dbEntry1!),
        response: {
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
        },
      });

      expect(entries[1].cid).to.equal(cid2);
      expect(entries[1].status).to.equal(200);
      expect(entries[1].etag).to.equal(await calcETag(dbEntry2!));
      expect(entries[1].response).to.have.property("ytId");
    } finally {
      await client.close();
    }
  });

  test("should accept a single cid parameter", async () => {
    await initDb();
    const res = await app.request("/api/briefs?c=100000");
    expect(res.status).to.equal(200);
    const entries = await res.json();
    expect(entries).to.be.an("array").with.lengthOf(1);
    expect(entries[0].cid).to.equal("100000");
    expect(entries[0].status).to.equal(200);
  });

  test("should redirect with 308 if cids are not sorted", async () => {
    await initDb();
    const res = await app.request("/api/briefs?c=100004&c=100000");
    expect(res.status).to.equal(308);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).to.equal("/api/briefs");
    expect(location.searchParams.getAll("c")).to.deep.equal([
      "100000",
      "100004",
    ]);
  });

  test("should redirect with 308 if cids contain duplicates", async () => {
    await initDb();
    const res = await app.request("/api/briefs?c=100000&c=100000");
    expect(res.status).to.equal(308);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).to.equal("/api/briefs");
    expect(location.searchParams.getAll("c")).to.deep.equal(["100000"]);
  });

  test("should return 207 Multi-Status when some cids are not found or deleted", async () => {
    await initDb();
    // 100000: exists, 100001: deleted, 100002: non-existent
    const res = await app.request("/api/briefs?c=100000&c=100001&c=100002");
    expect(res.status).to.equal(207);
    expect(res.headers.get("cache-control")).to.equal("no-cache");

    const entries = await res.json();
    expect(entries).to.be.an("array").with.lengthOf(3);
    expect(entries[0]).to.have.property("status", 200);
    expect(entries[0]).to.have.property("cid", "100000");
    expect(entries[1]).to.deep.equal({ cid: "100001", status: 404 });
    expect(entries[2]).to.deep.equal({ cid: "100002", status: 404 });
  });

  test("should return 207 Multi-Status when all cids are not found", async () => {
    await initDb();
    const res = await app.request("/api/briefs?c=100002&c=100003");
    expect(res.status).to.equal(207);
    expect(res.headers.get("cache-control")).to.equal("no-cache");

    const entries = await res.json();
    expect(entries).to.deep.equal([
      { cid: "100002", status: 404 },
      { cid: "100003", status: 404 },
    ]);
  });

  test("should return 400 for invalid cid format", async () => {
    await initDb();
    const res = await app.request("/api/briefs?c=invalid");
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.equal("badRequest");
    expect(body.flattened.nested.c[0]).to.be.a("string");
  });

  test("should return 400 when c parameter is missing", async () => {
    await initDb();
    const res = await app.request("/api/briefs");
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.equal("badRequest");
  });

  test("should return 400 when cids count exceeds maximum (100)", async () => {
    await initDb();
    // Generate 101 valid sorted CIDs: "100000", "100001", ..., "100100"
    const cids = Array.from({ length: 101 }, (_, i) => String(100000 + i));
    const query = cids.map((cid) => `c=${cid}`).join("&");
    const res = await app.request(`/api/briefs?${query}`);
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.equal("badRequest");
  });
});
