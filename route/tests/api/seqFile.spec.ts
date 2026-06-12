import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyLevel15, dummyLevel6, initDb } from "./init";
import { ChartSeqData, loadChart } from "@falling-nikochan/chart";
import msgpack from "@msgpack/msgpack";
import {
  calcETag,
  getChartEntryCompressed,
} from "@falling-nikochan/route/src/api/chart";
import { MongoClient } from "mongodb";

describe("GET /api/seqFile/:cid/:lvIndex", () => {
  test("should return ChartSeqData", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100000/0");
    expect(res.status).to.equal(200);
    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyLevel15()).notes);
  });
  test("should return ETag calculated by calcETag()", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100000/0");
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
    const res1 = await app.request("/api/seqFile/100000/0");
    expect(res1.status).to.equal(200);
    const etag = res1.headers.get("etag");
    expect(etag).to.be.a("string");

    const res2 = await app.request("/api/seqFile/100000/0", {
      headers: { "If-None-Match": etag! },
    });
    expect(res2.status).to.equal(304);
  });
  test("should return 200 for matching If-Match", async () => {
    await initDb();
    const res1 = await app.request("/api/seqFile/100000/0");
    expect(res1.status).to.equal(200);
    const etag = res1.headers.get("etag");
    expect(etag).to.be.a("string");

    const res2 = await app.request("/api/seqFile/100000/0", {
      headers: { "If-Match": etag! },
    });
    expect(res2.status).to.equal(200);
  });
  test("should return 412 for mismatching If-Match", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100000/0", {
      headers: { "If-Match": '"invalid-etag"' },
    });
    expect(res.status).to.equal(412);
    expect(await res.json()).to.deep.equal({ message: "etagMismatch" });
  });
  test("should return ChartSeqData without upgrading to latest ChartPlay if chart version is 6", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100006/0");
    expect(res.status).to.equal(200);
    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyLevel6()).notes);
    expect(seqData.notes).to.not.deep.equal(loadChart(dummyLevel15()).notes);
  });
  test("should return ChartSeqData without upgrading to latest ChartPlay if chart version is 5", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100005/0");
    expect(res.status).to.equal(200);
    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyLevel6()).notes);
    expect(seqData.notes).to.not.deep.equal(loadChart(dummyLevel15()).notes);
  });
  test("should return ChartSeqData without upgrading to latest ChartPlay if chart version is 4", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100004/0");
    expect(res.status).to.equal(200);
    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyLevel6()).notes);
    expect(seqData.notes).to.not.deep.equal(loadChart(dummyLevel15()).notes);
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100002/0");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 404 for deleted cid", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100001/0");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 404 for nonexistent lvIndex", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100000/5");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "levelNotFound" });
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/invalid/0");
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.equal("badRequest");
    expect(body.flattened.nested.cid[0]).to.be.a("string");
  });
});
