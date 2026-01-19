import { test, describe } from "node:test";
import { expect } from "chai";
import { app, initDb } from "./init";
import { hash } from "@falling-nikochan/chart";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";

describe("DELETE /api/chartFile/:cid", () => {
  test(
    "should return 429 for too many requests",
    {
      skip:
        process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT,
    },
    async () => {
      await initDb();
      const res1 = await app.request("/api/chartFile/100000?p=p");
      expect(res1.status).to.equal(200);

      const res2 = await app.request("/api/chartFile/100000?p=p", {
        method: "delete",
      });
      expect(res2.status).to.equal(429);
      const body = await res2.json();
      expect(body).to.deep.equal({ message: "tooManyRequest" });
    }
  );

  test("should delete ChartEdit if password hash matches", async () => {
    await initDb();
    expect((await app.request("/api/brief/100000")).status).to.equal(200);
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "delete",
    });
    expect(res.status).to.equal(204);
    expect((await app.request("/api/brief/100000")).status).to.equal(404);
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

    expect((await app.request("/api/brief/100000")).status).to.equal(200);
    const res = await app.request(
      "/api/chartFile/100000?ph=" + (await hash(pServerHash + "def")),
      {
        headers: { Cookie: "pUserSalt=def" },
        method: "delete",
      }
    );
    expect(res.status).to.equal(204);
    expect((await app.request("/api/brief/100000")).status).to.equal(404);
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000a?p=p", {
      method: "delete",
    });
    expect(res.status).to.equal(400);
  });
  test("should return 401 for wrong password", async () => {
    await initDb();
    expect((await app.request("/api/brief/100000")).status).to.equal(200);
    const res = await app.request(
      "/api/chartFile/100000?p=wrong&ph=" + (await hash("wrong")),
      { method: "delete" }
    );
    expect(res.status).to.equal(401);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "badPassword" });
    expect((await app.request("/api/brief/100000")).status).to.equal(200);
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100001?p=p", {
      method: "delete",
    });
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
});
