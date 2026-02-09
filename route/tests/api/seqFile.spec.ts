import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyLevel13, dummyLevel6, initDb } from "./init";
import { ChartSeqData, loadChart } from "@falling-nikochan/chart";
import msgpack from "@msgpack/msgpack";

describe("GET /api/seqFile/:cid/:lvIndex", () => {
  test("should return ChartSeqData", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100000/0");
    expect(res.status).to.equal(200);
    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyLevel13()).notes);
  });
  test("should return ChartSeqData without upgrading to latest ChartPlay if chart version is 6", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100006/0");
    expect(res.status).to.equal(200);
    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyLevel6()).notes);
    expect(seqData.notes).to.not.deep.equal(loadChart(dummyLevel13()).notes);
  });
  test("should return ChartSeqData without upgrading to latest ChartPlay if chart version is 5", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100005/0");
    expect(res.status).to.equal(200);
    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyLevel6()).notes);
    expect(seqData.notes).to.not.deep.equal(loadChart(dummyLevel13()).notes);
  });
  test("should return ChartSeqData without upgrading to latest ChartPlay if chart version is 4", async () => {
    await initDb();
    const res = await app.request("/api/seqFile/100004/0");
    expect(res.status).to.equal(200);
    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyLevel6()).notes);
    expect(seqData.notes).to.not.deep.equal(loadChart(dummyLevel13()).notes);
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
