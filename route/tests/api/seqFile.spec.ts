import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyLevel13, dummyLevel6, initDb } from "./init";
import { ChartSeqData13, ChartSeqData6 } from "@falling-nikochan/chart";
import msgpack from "@ygoe/msgpack";

describe("GET /api/seqFile/:cid/:lvIndex", () => {
  test("should return ChartSeqData13", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100000/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData13 = msgpack.deserialize(
      await res.arrayBuffer()
    );
    expect(seqData.ver).to.equal(13);
    expect(seqData).to.have.property("notes");
    expect(seqData).to.have.property("bpmChanges");
    expect(seqData).to.have.property("speedChanges");
    expect(seqData).to.have.property("signature");
    expect(seqData).to.have.property("offset");
    expect(seqData).to.have.property("ytBegin");
    expect(seqData).to.have.property("ytEndSec");
  });
  test("should return ChartSeqData13 if chart version is 12", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100012/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData13 = msgpack.deserialize(
      await res.arrayBuffer()
    );
    expect(seqData.ver).to.equal(13);
  });
  test("should return ChartSeqData13 if chart version is 11", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100011/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData13 = msgpack.deserialize(
      await res.arrayBuffer()
    );
    expect(seqData.ver).to.equal(13);
  });
  test("should return ChartSeqData13 if chart version is 10", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100010/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData13 = msgpack.deserialize(
      await res.arrayBuffer()
    );
    expect(seqData.ver).to.equal(13);
  });
  test("should return ChartSeqData13 if chart version is 9", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100009/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData13 = msgpack.deserialize(
      await res.arrayBuffer()
    );
    expect(seqData.ver).to.equal(13);
  });
  test("should return ChartSeqData13 if chart version is 8", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100008/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData13 = msgpack.deserialize(
      await res.arrayBuffer()
    );
    expect(seqData.ver).to.equal(13);
  });
  test("should return ChartSeqData13 if chart version is 7", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100007/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData13 = msgpack.deserialize(
      await res.arrayBuffer()
    );
    expect(seqData.ver).to.equal(13);
  });
  test("should return ChartSeqData6 if chart version is 6", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100006/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData6 = msgpack.deserialize(await res.arrayBuffer());
    expect(seqData.ver).to.equal(6);
    expect(seqData).to.have.property("notes");
    expect(seqData).to.have.property("bpmChanges");
    expect(seqData).to.have.property("signature");
    expect(seqData).to.have.property("offset");
  });
  test("should return ChartSeqData6 if chart version is 5", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100005/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData6 = msgpack.deserialize(await res.arrayBuffer());
    expect(seqData.ver).to.equal(6);
  });
  test("should return ChartSeqData6 if chart version is 4", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100004/0");
    expect(res.status).to.equal(200);
    const seqData: ChartSeqData6 = msgpack.deserialize(await res.arrayBuffer());
    expect(seqData.ver).to.equal(6);
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
  });
});
