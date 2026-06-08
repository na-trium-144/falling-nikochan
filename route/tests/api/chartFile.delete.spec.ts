import { test, describe } from "node:test";
import { expect } from "chai";
import { app, db, initDb } from "./init";
import { hash } from "@falling-nikochan/chart";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";

const encodeBase64Utf8 = (value: string) =>
  btoa(
    Array.from(new TextEncoder().encode(value), (byte) =>
      String.fromCodePoint(byte)
    ).join("")
  );
const basicAuth = (passwd: string) =>
  `Nikochan-Basic ${encodeBase64Utf8(passwd)}`;
const hashAuth = (passwdHash: string) => `Nikochan-Hash ${passwdHash}`;

describe("DELETE /api/chartFile/:cid", () => {
  test(
    "should return 429 for too many requests",
    {
      skip:
        process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT,
    },
    async () => {
      await initDb();
      const res1 = await app.request("/api/chartFile/100000", {
        headers: { Authorization: basicAuth("p") },
      });
      expect(res1.status).to.equal(200);

      const res2 = await app.request("/api/chartFile/100000", {
        method: "delete",
        headers: { Authorization: basicAuth("p") },
      });
      expect(res2.status).to.equal(429);
      const body = await res2.json();
      expect(body).to.deep.equal({ message: "tooManyRequest" });
    }
  );

  test("should delete ChartEdit if password hash matches", async () => {
    await initDb();
    expect((await app.request("/api/brief/100000")).status).to.equal(200);
    const res = await app.request("/api/chartFile/100000", {
      method: "delete",
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(204);
    expect((await app.request("/api/brief/100000")).status).to.equal(404);
  });
  test("should delete ChartEdit if password hash with pUserSalt matches", async () => {
    await initDb();
    const pServerHash = (await db
      .collection<ChartEntryCompressed>("chart")
      .findOne({ cid: "100000" }))!.pServerHash!;

    expect((await app.request("/api/brief/100000")).status).to.equal(200);
    const res = await app.request("/api/chartFile/100000", {
      headers: {
        Authorization: hashAuth(await hash(pServerHash + "def")),
        Cookie: "pUserSalt=def",
      },
      method: "delete",
    });
    expect(res.status).to.equal(204);
    expect((await app.request("/api/brief/100000")).status).to.equal(404);
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000a", {
      method: "delete",
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.equal("badRequest");
    expect(body.flattened.nested.cid[0]).to.be.a("string");
  });
  test("should return 401 for wrong password", async () => {
    await initDb();
    expect((await app.request("/api/brief/100000")).status).to.equal(200);
    const res = await app.request("/api/chartFile/100000", {
      method: "delete",
      headers: { Authorization: basicAuth("wrong") },
    });
    expect(res.status).to.equal(401);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "badPassword" });
    expect((await app.request("/api/brief/100000")).status).to.equal(200);
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100001", {
      method: "delete",
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
});
