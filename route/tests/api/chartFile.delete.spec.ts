import { expect, test, describe } from "vitest";
import {
  app,
  dummyChart,
  dummyChart10,
  dummyChart11,
  dummyChart6,
  dummyChart7,
  dummyChart8,
  dummyChart9,
  initDb,
} from "./init";
import {
  Chart11Edit,
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

describe("DELETE /api/chartFile/:cid", () => {
  test("should delete ChartEdit if password hash matches", async () => {
    await initDb();
    expect((await app.request("/api/brief/100000")).status).toBe(200);
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "delete",
    });
    expect(res.status).toBe(204);
    expect((await app.request("/api/brief/100000")).status).toBe(404);
  });
  test("should delete ChartEdit if password hash with pUserSalt matches", async () => {
    await initDb();
    let pServerHash: string;
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      pServerHash = (await (await client.connect())
        .db("nikochan")
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: "100000" }))!.pServerHash!;
    } finally {
      client.close();
    }

    expect((await app.request("/api/brief/100000")).status).toBe(200);
    const res = await app.request(
      "/api/chartFile/100000?ph=" + (await hash(pServerHash + "def")),
      {
        headers: { Cookie: "pUserSalt=def" },
        method: "delete",
      }
    );
    expect(res.status).toBe(204);
    expect((await app.request("/api/brief/100000")).status).toBe(404);
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000a?p=p", {
      method: "delete",
    });
    expect(res.status).toBe(400);
  });
  test("should return 401 for wrong password", async () => {
    await initDb();
    expect((await app.request("/api/brief/100000")).status).toBe(200);
    const res = await app.request(
      "/api/chartFile/100000?p=wrong&ph=" + (await hash("wrong")),
      { method: "delete" }
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "badPassword" });
    expect((await app.request("/api/brief/100000")).status).toBe(200);
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100001?p=p", {
      method: "delete",
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "chartIdNotFound" });
  });
});
