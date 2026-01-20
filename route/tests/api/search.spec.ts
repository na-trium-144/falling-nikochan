import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyCid, initDb } from "./init";

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
});
