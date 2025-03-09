import { expect, test, describe } from "bun:test";
import { dummyChart, dummyChart6, dummyChart7, initDb } from "./init";
import app from "@falling-nikochan/route";
import {
  Chart4,
  Chart5,
  Chart6,
  Chart7,
  ChartEdit,
  hash,
} from "@falling-nikochan/chart";
import msgpack from "@ygoe/msgpack";

describe("GET /api/chartFile/:cid", () => {
  test("should return ChartEdit if raw password matches", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?pw=p");
    expect(res.status).toBe(200);
    const chart: ChartEdit = msgpack.deserialize(await res.arrayBuffer());
    expect(chart).toStrictEqual(dummyChart());
  });
  test("should return ChartEdit if password hash matches", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100000?ph=" + (await hash("100000pdef")),
      {
        headers: { Cookie: "hashKey=def" },
      }
    );
    expect(res.status).toBe(200);
    const chart: ChartEdit = msgpack.deserialize(await res.arrayBuffer());
    expect(chart).toStrictEqual(dummyChart());
  });
  test("should return Chart7 if chart version is 7", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100007?pw=p");
    expect(res.status).toBe(200);
    const chart: Chart7 = msgpack.deserialize(await res.arrayBuffer());
    expect(chart).toStrictEqual(dummyChart7());
  });
  test("should return Chart6 if chart version is 6", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100006?pw=p");
    expect(res.status).toBe(200);
    const chart: Chart6 = msgpack.deserialize(await res.arrayBuffer());
    expect(chart).toStrictEqual(dummyChart6());
  });
  test("should return Chart5 if chart version is 5", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100005?pw=p");
    expect(res.status).toBe(200);
    const chart: Chart5 = msgpack.deserialize(await res.arrayBuffer());
    // expect(chart).toStrictEqual(dummyChart5());
    expect(chart.ver).toBe(5);
  });
  test("should return Chart4 if chart version is 4", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100004?pw=p");
    expect(res.status).toBe(200);
    const chart: Chart4 = msgpack.deserialize(await res.arrayBuffer());
    // expect(chart).toStrictEqual(dummyChart4());
    expect(chart.ver).toBe(4);
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000a?pw=p");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "invalidChartId" });
  });
  test("should return 401 for wrong password", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?pw=wrong&ph=wrong");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "badPassword" });
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100001?pw=p");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "chartIdNotFound" });
  });
});
