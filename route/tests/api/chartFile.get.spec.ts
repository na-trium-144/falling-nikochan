import { expect, test, describe } from "bun:test";
import {
  dummyChart,
  dummyChart6,
  dummyChart7,
  dummyChart8,
  initDb,
} from "./init";
import app from "@falling-nikochan/route";
import {
  Chart4,
  Chart5,
  Chart6,
  Chart7,
  Chart8Edit,
  Chart9Edit,
  hash,
} from "@falling-nikochan/chart";
import msgpack from "@ygoe/msgpack";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";

describe("GET /api/chartFile/:cid", () => {
  test("should return ChartEdit if password hash matches", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100000?p=" + (await hash("100000p")),
    );
    expect(res.status).toBe(200);
    const chart: Chart9Edit = msgpack.deserialize(await res.arrayBuffer());
    expect(chart).toStrictEqual(dummyChart());
  });
  test("should return ChartEdit if password hash with pUserSalt matches", async () => {
    await initDb();
    let pServerHash: string;
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      pServerHash = (await (await client.connect())
        .db("nikochan")
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: "100000" }))!.pServerHash;
    } finally {
      client.close();
    }

    const res = await app.request(
      "/api/chartFile/100000?ph=" + (await hash(pServerHash + "def")),
      {
        headers: { Cookie: "pUserSalt=def" },
      },
    );
    expect(res.status).toBe(200);
    const chart: Chart9Edit = msgpack.deserialize(await res.arrayBuffer());
    expect(chart).toStrictEqual(dummyChart());
  });
  test("should return Chart8 if chart version is 8", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100008?p=" + (await hash("100008p")),
    );
    expect(res.status).toBe(200);
    const chart: Chart8Edit = msgpack.deserialize(await res.arrayBuffer());
    expect(chart).toStrictEqual(dummyChart8());
  });
  test("should return Chart7 if chart version is 7", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100007?p=" + (await hash("100007p")),
    );
    expect(res.status).toBe(200);
    const chart: Chart7 = msgpack.deserialize(await res.arrayBuffer());
    expect(chart).toStrictEqual(dummyChart7());
  });
  test("should return Chart6 if chart version is 6", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100006?p=" + (await hash("100006p")),
    );
    expect(res.status).toBe(200);
    const chart: Chart6 = msgpack.deserialize(await res.arrayBuffer());
    expect(chart).toStrictEqual(dummyChart6());
  });
  test("should return Chart5 if chart version is 5", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100005?p=" + (await hash("100005p")),
    );
    expect(res.status).toBe(200);
    const chart: Chart5 = msgpack.deserialize(await res.arrayBuffer());
    // expect(chart).toStrictEqual(dummyChart5());
    expect(chart.ver).toBe(5);
  });
  test("should return Chart4 if chart version is 4", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100004?p=" + (await hash("100004p")),
    );
    expect(res.status).toBe(200);
    const chart: Chart4 = msgpack.deserialize(await res.arrayBuffer());
    // expect(chart).toStrictEqual(dummyChart4());
    expect(chart.ver).toBe(4);
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000a?p=p");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "invalidChartId" });
  });
  test("should return 401 for wrong password", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=wrong&ph=wrong");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "badPassword" });
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100001?p=p");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "chartIdNotFound" });
  });
});
