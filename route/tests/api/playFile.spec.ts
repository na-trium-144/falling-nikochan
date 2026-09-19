import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyLevel15, dummyLevel17, dummyLevel6, initDb } from "./init";
import {
  currentChartVer,
  Level15Play,
  Level6Play,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import {
  calcETag,
  getChartEntryCompressed,
} from "@falling-nikochan/route/src/api/chart";
import { MongoClient } from "mongodb";

describe("GET /api/playFile/:cid/:lvIndex", () => {
  test("should return LevelPlay", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100000/0");
    expect(res.status).to.equal(200);
    const level = msgpack.decode(await res.arrayBuffer()) as Level15Play;
    expect(level).to.deep.equal(dummyLevel17());
  });
  test("should return ETag calculated by calcETag()", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100000/0");
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
    const res1 = await app.request("/api/playFile/100000/0");
    expect(res1.status).to.equal(200);
    const etag = res1.headers.get("etag");
    expect(etag).to.be.a("string");

    const res2 = await app.request("/api/playFile/100000/0", {
      headers: { "If-None-Match": etag! },
    });
    expect(res2.status).to.equal(304);
  });
  test("should return 200 for matching If-Match", async () => {
    await initDb();
    const res1 = await app.request("/api/playFile/100000/0");
    expect(res1.status).to.equal(200);
    const etag = res1.headers.get("etag");
    expect(etag).to.be.a("string");

    const res2 = await app.request("/api/playFile/100000/0", {
      headers: { "If-Match": etag! },
    });
    expect(res2.status).to.equal(200);
  });
  test("should return 412 for mismatching If-Match", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100000/0", {
      headers: { "If-Match": '"invalid-etag"' },
    });
    expect(res.status).to.equal(412);
    expect(await res.json()).to.deep.equal({ message: "etagMismatch" });
  });
  currentChartVer satisfies 17; // edit tests below when chart version is bumped
  // for (const ver of []) {
  //   test("should return Level17Play if chart version is " + ver, async () => {});
  // }
  for (const ver of [16, 15, 14, 13, 12, 11, 10, 9, 8, 7]) {
    test("should return Level15Play if chart version is " + ver, async () => {
      await initDb();
      const res = await app.request(`/api/playFile/${100000 + ver}/0`);
      expect(res.status).to.equal(200);
      const level = msgpack.decode(await res.arrayBuffer()) as Level15Play;
      expect(level).to.deep.include(dummyLevel15());
    });
  }
  for (const ver of [6, 5]) {
    test("should return Level6Play if chart version is " + ver, async () => {
      await initDb();
      const res = await app.request(`/api/playFile/${100000 + ver}/0`);
      expect(res.status).to.equal(200);
      const level = msgpack.decode(await res.arrayBuffer()) as Level6Play;
      expect(level).to.deep.include(dummyLevel6());
    });
  }
  test("should return Level6Play if chart version is 4", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100004/0");
    expect(res.status).to.equal(200);
    const level = msgpack.decode(await res.arrayBuffer()) as Level6Play;
    // ↓ 本来はChart4→6の変換でsignatureが[]になるはずはないのだが、
    // テスト用のダミーデータを雑に作りすぎたためsignatureの追加に失敗している
    expect(level).to.deep.include({ ...dummyLevel6(), signature: [] });
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100002/0");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 404 for deleted cid", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100001/0");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 404 for nonexistent lvIndex", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100000/5");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "levelNotFound" });
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/playFile/invalid/0");
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.equal("badRequest");
    expect(body.flattened.nested.cid[0]).to.be.a("string");
  });
});
