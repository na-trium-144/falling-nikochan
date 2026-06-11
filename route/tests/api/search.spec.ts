import { test, describe } from "node:test";
import { expect } from "chai";
import { app, db, dummyCid, initDb } from "./init";
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
  test("empty query returns all charts", async () => {
    await initDb();
    const res = await app.request("/api/search?q=");
    expect(res.status).to.equal(200);
    expect(await res.json()).to.deep.include({ cid: dummyCid });
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

    const date = new Date().getTime();
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: dummyCid },
      {
        $set: {
          updatedAt: date,
          published: true,
        },
      }
    );

    const res2 = await app.request("/api/search?sort=latest");
    expect(res2.status).to.equal(200);
    const entries2: { cid: string }[] = await res2.json();
    expect(entries2.length).to.be.at.most(25);
    expect(entries2[0]).to.deep.equal({
      cid: dummyCid,
      updatedAt: date,
    });
  });

  test("regex special characters are escaped", async () => {
    await initDb();
    // Queries containing regex special characters should not throw and return valid JSON
    for (const q of [".*", "[invalid", "^$", "(foo|bar)+", "\\w+"]) {
      const res = await app.request(`/api/search?q=${encodeURIComponent(q)}`);
      expect(res.status).to.equal(200);
      const body = await res.json();
      expect(body).to.be.an("array");
    }
  });
  test("should return 304 for matching If-None-Match", async () => {
    await initDb();
    const res1 = await app.request("/api/search?q=テスト");
    expect(res1.status).to.equal(200);
    const etag = res1.headers.get("etag");
    expect(etag).to.be.a("string");

    const res2 = await app.request("/api/search?q=テスト", {
      headers: { "If-None-Match": etag! },
    });
    expect(res2.status).to.equal(304);
  });

  describe("c parameter", () => {
    test("single cid", async () => {
      await initDb();
      const res = await app.request(`/api/search?c=${dummyCid}`);
      expect(res.status).to.equal(200);
      const json = await res.json();
      expect(json).to.have.lengthOf(1);
      expect(json[0].cid).to.equal(dummyCid);
    });

    test("multiple cids with order preserved", async () => {
      await initDb();
      const cid2 = String(Number(dummyCid) + 4);
      const res = await app.request(`/api/search?c=${cid2}&c=${dummyCid}`);
      expect(res.status).to.equal(200);
      const json = await res.json();
      expect(json).to.have.lengthOf(2);
      expect(json[0].cid).to.equal(cid2);
      expect(json[1].cid).to.equal(dummyCid);
    });

    test("filter by query and cids", async () => {
      await initDb();
      const cid2 = String(Number(dummyCid) + 4);
      const res = await app.request(
        `/api/search?q=テスト&c=${dummyCid}&c=${cid2}`
      );
      expect(res.status).to.equal(200);
      const json = await res.json();
      expect(json).to.have.lengthOf(2);
    });

    test("returns 400 when used with sort", async () => {
      await initDb();
      const res = await app.request(`/api/search?c=${dummyCid}&sort=latest`);
      expect(res.status).to.equal(400);
    });

    test("excludes non-existent or deleted cids", async () => {
      await initDb();
      const deletedCid = String(Number(dummyCid) + 1);
      const nonExistentCid = "999999";
      const res = await app.request(
        `/api/search?c=${dummyCid}&c=${deletedCid}&c=${nonExistentCid}`
      );
      expect(res.status).to.equal(200);
      const json = await res.json();
      expect(json).to.have.lengthOf(1);
      expect(json[0].cid).to.equal(dummyCid);
    });
  });
});
