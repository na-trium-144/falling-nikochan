import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyCid, initDb } from "./init";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "../../src/api/chart";

describe("GET /api/search", () => {
  test("single word", async () => {
    await initDb();
    const res = await app.request("/api/search?q=テスト");
    expect(res.status).to.equal(200);
    expect(await res.json()).to.deep.include({ cid: dummyCid });
  });
  test("normalize word", async () => {
    await initDb();
    const res = await app.request("/api/search?q=てｽと");
    expect(res.status).to.equal(200);
    expect(await res.json()).to.deep.include({ cid: dummyCid });
  });
  test("case insensitive", async () => {
    await initDb();
    const res = await app.request("/api/search?q=TEST");
    expect(res.status).to.equal(200);
    expect(await res.json()).to.deep.include({ cid: dummyCid });
  });
  test("multiple words", async () => {
    await initDb();
    const res = await app.request("/api/search?q=てすと+test");
    expect(res.status).to.equal(200);
    expect(await res.json()).to.deep.include({ cid: dummyCid });
  });
  test("cid search", async () => {
    await initDb();
    const res = await app.request("/api/search?q=100000");
    expect(res.status).to.equal(200);
    expect(await res.json()).to.deep.include({ cid: dummyCid });
  });
  test("not found", async () => {
    await initDb();
    const res = await app.request("/api/search?q=notfound");
    expect(res.status).to.equal(200);
    expect(await res.json()).to.not.deep.include({ cid: dummyCid });
  });
  test("empty query", async () => {
    await initDb();
    const res = await app.request("/api/search?q=");
    expect(res.status).to.equal(200);
    expect(await res.json()).to.not.deep.include({ cid: dummyCid });
  });

  test("should return latest entries with sort=latest", async () => {
    await initDb();
    const res = await app.request("/api/search?sort=latest");
    expect(res.status).to.equal(200);
    const entries: { cid: string }[] = await res.json();
    expect(entries.length).to.be.at.most(25);
    for (const entry of entries) {
      expect(entry.cid).to.be.a("string");
    }

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      await db.collection<ChartEntryCompressed>("chart").updateOne(
        { cid: dummyCid },
        {
          $set: {
            updatedAt: new Date().getTime(),
            published: true,
          },
        }
      );
    } finally {
      await client.close();
    }

    const res2 = await app.request("/api/latest");
    expect(res2.status).to.equal(200);
    const entries2: { cid: string }[] = await res2.json();
    expect(entries2.length).to.be.at.most(25);
    expect(entries2[0]).to.deep.equal({
      cid: dummyCid,
    });
  });
});
