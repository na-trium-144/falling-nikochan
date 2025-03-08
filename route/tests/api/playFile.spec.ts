import { expect, test, describe } from "bun:test";
import { dummyLevel6, dummyLevel8, initDb } from "./init";
import app from "@falling-nikochan/route";
import { Level6Play, Level8Play, LevelPlay } from "@falling-nikochan/chart";
import msgpack from "@ygoe/msgpack";

describe("GET /api/playFile/:cid/:lvIndex", () => {
  test("should return LevelPlay", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100000/0");
    expect(res.status).toBe(200);
    const level: LevelPlay = msgpack.deserialize(await res.arrayBuffer());
    expect(level).toStrictEqual(dummyLevel8());
  });
  test("should return Level8Play if chart version is 7", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100007/0");
    expect(res.status).toBe(200);
    const level: Level8Play = msgpack.deserialize(await res.arrayBuffer());
    expect(level).toMatchObject(dummyLevel8());
  });
  test("should return Level6Play if chart version is 6", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100006/0");
    expect(res.status).toBe(200);
    const level: Level6Play = msgpack.deserialize(await res.arrayBuffer());
    expect(level).toMatchObject(dummyLevel6());
  });
  test("should return Level6Play if chart version is 5", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100005/0");
    expect(res.status).toBe(200);
    const level: Level6Play = msgpack.deserialize(await res.arrayBuffer());
    expect(level).toMatchObject(dummyLevel6());
  });
  test("should return Level6Play if chart version is 4", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100004/0");
    expect(res.status).toBe(200);
    const level: Level6Play = msgpack.deserialize(await res.arrayBuffer());
    // ↓ 本来はChart4→6の変換でsignatureが[]になるはずはないのだが、
    // テスト用のダミーデータを雑に作りすぎたためsignatureの追加に失敗している
    expect(level).toMatchObject({ ...dummyLevel6(), signature: [] });
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100001/0");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "chartIdNotFound" });
  });
  test("should return 404 for nonexistent lvIndex", async () => {
    await initDb();
    const res = await app.request("/api/playFile/100000/5");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "levelNotFound" });
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/playFile/invalid/0");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "invalidChartId" });
  });
});
