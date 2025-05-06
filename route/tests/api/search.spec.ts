import { expect, test, describe } from "bun:test";
import { app, dummyCid, initDb } from "./init";

describe("GET /api/search", () => {
  test("single word", async () => {
    await initDb();
    const res = await app.request("/api/search?q=テスト");
    expect(res.status).toBe(200);
    expect(await res.json()).toContainEqual({ cid: dummyCid });
  });
  test("normalize word", async () => {
    await initDb();
    const res = await app.request("/api/search?q=てｽと");
    expect(res.status).toBe(200);
    expect(await res.json()).toContainEqual({ cid: dummyCid });
  });
  test("case insensitive", async () => {
    await initDb();
    const res = await app.request("/api/search?q=TEST");
    expect(res.status).toBe(200);
    expect(await res.json()).toContainEqual({ cid: dummyCid });
  });
  test("multiple words", async () => {
    await initDb();
    const res = await app.request("/api/search?q=てすと+test");
    expect(res.status).toBe(200);
    expect(await res.json()).toContainEqual({ cid: dummyCid });
  });
  test("cid search", async () => {
    await initDb();
    const res = await app.request("/api/search?q=100000");
    expect(res.status).toBe(200);
    expect(await res.json()).toContainEqual({ cid: dummyCid });
  });
  test("not found", async () => {
    await initDb();
    const res = await app.request("/api/search?q=notfound");
    expect(res.status).toBe(200);
    expect(await res.json()).not.toContainEqual({ cid: dummyCid });
  });
  test("empty query", async () => {
    await initDb();
    const res = await app.request("/api/search?q=");
    expect(res.status).toBe(200);
    expect(await res.json()).not.toContainEqual({ cid: dummyCid });
  });
});
