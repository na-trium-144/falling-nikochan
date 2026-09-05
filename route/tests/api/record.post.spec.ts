import { test, describe } from "node:test";
import { expect } from "chai";
import { app, createTestPlaySession, db, dummyCid, initDb } from "./init";
import { RecordPost, hash } from "@falling-nikochan/chart";
import { PlayRecordEntry } from "@falling-nikochan/route/src/api/record";
import { sign } from "hono/jwt";

describe("POST /api/record/:cid", () => {
  test(
    "should return 429 for too many requests",
    {
      skip:
        process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT,
    },
    async () => {
      await initDb();
      const { sessionToken, sessionKeyPair } =
        await createTestPlaySession(dummyCid);

      const recordPayload: RecordPost = {
        lvHash: await hash("dummy"),
        auto: false,
        score: 100,
        baseScore: 70,
        chainScore: 15,
        bigScore: 15,
        fc: true,
        fb: false,
        factor: 0.5,
        editing: false,
        date: Date.now(),
      };

      const signedBody1 = await sign(
        recordPayload as Record<string, unknown>,
        sessionKeyPair.privateKey,
        "ES256"
      );

      const res1 = await app.request(`/api/record/${dummyCid}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "text/plain",
        },
        body: signedBody1,
      });
      expect(res1.status).to.equal(204);

      const signedBody2 = await sign(
        recordPayload as Record<string, unknown>,
        sessionKeyPair.privateKey,
        "ES256"
      );

      const res2 = await app.request(`/api/record/${dummyCid}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "text/plain",
        },
        body: signedBody2,
      });
      expect(res2.status).to.equal(429);
      const body = await res2.json();
      expect(body).to.deep.equal({ message: "tooManyRequest" });
    }
  );

  test("should store record with valid signature and token", async () => {
    await initDb();
    const { sessionToken, sessionKeyPair } =
      await createTestPlaySession(dummyCid);

    const now = Date.now();
    const recordPayload1: RecordPost = {
      lvHash: await hash("dummy"),
      auto: false,
      score: 100,
      baseScore: 70,
      chainScore: 15,
      bigScore: 15,
      fc: true,
      fb: false,
      factor: 0.5,
      editing: false,
      date: now,
    };

    const signedBody1 = await sign(
      recordPayload1 as Record<string, unknown>,
      sessionKeyPair.privateKey,
      "ES256"
    );

    const res1 = await app.request(`/api/record/${dummyCid}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "text/plain",
      },
      body: signedBody1,
    });
    expect(res1.status).to.equal(204);

    const records = await db
      .collection<PlayRecordEntry>("playRecord")
      .find({ $and: [{ cid: dummyCid }, { lvHash: await hash("dummy") }] })
      .toArray();
    expect(records.length).to.equal(1);
    expect(records[0]).to.include({
      lvHash: await hash("dummy"),
      auto: false,
      score: 100,
      baseScore: 70,
      chainScore: 15,
      bigScore: 15,
      fc: true,
      fb: false,
      factor: 0.5,
      editing: false,
      playedAt: now,
    });

    const { sessionToken: sessionToken2, sessionKeyPair: sessionKeyPair2 } =
      await createTestPlaySession(dummyCid);
    const recordPayload2: RecordPost = {
      lvHash: await hash("dummy"),
      auto: false,
      score: 50,
      baseScore: 30,
      chainScore: 10,
      bigScore: 10,
      fc: false,
      fb: true,
      factor: 0.5,
      editing: false,
      date: now,
    };

    const signedBody2 = await sign(
      recordPayload2 as Record<string, unknown>,
      sessionKeyPair2.privateKey,
      "ES256"
    );

    const res2 = await app.request(`/api/record/${dummyCid}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken2}`,
        "Content-Type": "text/plain",
        "x-forwarded-for": "123",
      },
      body: signedBody2,
    });
    expect(res2.status).to.equal(204);

    const record2 = await db
      .collection<PlayRecordEntry>("playRecord")
      .find({ $and: [{ cid: dummyCid }, { lvHash: await hash("dummy") }] })
      .toArray();
    expect(record2.length).to.equal(2);
  });

  test("should return 409 for same request", async () => {
    await initDb();
    const { sessionToken, sessionKeyPair } =
      await createTestPlaySession(dummyCid);

    const now = Date.now();
    const recordPayload1: RecordPost = {
      lvHash: await hash("dummy"),
      auto: false,
      score: 100,
      baseScore: 70,
      chainScore: 15,
      bigScore: 15,
      fc: true,
      fb: false,
      factor: 0.5,
      editing: false,
      date: now,
    };

    const signedBody1 = await sign(
      recordPayload1 as Record<string, unknown>,
      sessionKeyPair.privateKey,
      "ES256"
    );

    const res1 = await app.request(`/api/record/${dummyCid}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "text/plain",
      },
      body: signedBody1,
    });
    expect(res1.status).to.equal(204);

    const res2 = await app.request(`/api/record/${dummyCid}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "text/plain",
        "x-forwarded-for": "123",
      },
      body: signedBody1,
    });
    expect(res2.status).to.equal(409);

    const record2 = await db
      .collection<PlayRecordEntry>("playRecord")
      .find({ $and: [{ cid: dummyCid }, { lvHash: await hash("dummy") }] })
      .toArray();
    expect(record2.length).to.equal(1);
  });

  test("should return 401 when Authorization header is missing or invalid", async () => {
    const res = await app.request(`/api/record/${dummyCid}`, {
      method: "POST",
      body: "jwt-body",
    });
    expect(res.status).to.equal(401);

    const resInvalid = await app.request(`/api/record/${dummyCid}`, {
      method: "POST",
      headers: { Authorization: "Bearer invalid.jwt.token" },
      body: "jwt-body",
    });
    expect(resInvalid.status).to.equal(401);
  });

  test("should return 422 when body signature is invalid", async () => {
    const { sessionToken } = await createTestPlaySession(dummyCid);
    const anotherKeyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const signedBody = await sign(
      {
        lvHash: await hash("dummy"),
        auto: false,
        score: 100,
        baseScore: 70,
        chainScore: 15,
        bigScore: 15,
        fc: true,
        fb: false,
        factor: 0.5,
        editing: false,
        date: Date.now(),
      },
      anotherKeyPair.privateKey,
      "ES256"
    );

    const res = await app.request(`/api/record/${dummyCid}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: signedBody,
    });
    expect(res.status).to.equal(422);
  });

  /*test("should return 422 when timestamp is older than 5 minutes", async () => {
    const { sessionToken, sessionKeyPair } =
      await createTestPlaySession(dummyCid);

    const signedBody = await sign(
      {
        lvHash: await hash("dummy"),
        auto: false,
        score: 100,
        baseScore: 70,
        chainScore: 15,
        bigScore: 15,
        fc: true,
        fb: false,
        factor: 0.5,
        editing: false,
        date: Date.now() - 1000 * 60 * 10, // 10 minutes ago
      },
      sessionKeyPair.privateKey,
      "ES256"
    );

    const res = await app.request(`/api/record/${dummyCid}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: signedBody,
    });
    expect(res.status).to.equal(422);
  });
  */
});
