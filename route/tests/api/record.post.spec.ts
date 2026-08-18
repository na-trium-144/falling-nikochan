import { test, describe } from "node:test";
import { expect } from "chai";
import { app, db, initDb } from "./init";
import {
  RecordPost,
  hash,
  generateKeyPair,
  signData,
  importPrivateKey,
  DEFAULT_DEV_RESULT_SECRET_PRIVATE_KEY,
  serializeDate4,
  ResultSerialized,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { PlayRecordEntry } from "@falling-nikochan/route/src/api/record";
import { sign as signJwt } from "hono/jwt";

async function createValidRecordData(params?: {
  score100?: number;
  baseScore100?: number;
  chainScore100?: number;
  bigScore100?: number;
  factor?: number;
  editing?: boolean;
  auto?: boolean;
  playbackRate4?: number;
}): Promise<{ body: RecordPost; token: string }> {
  const sessionKeyPair = await generateKeyPair();
  const resultSecretPriv = await importPrivateKey(
    process.env.RESULT_SECRET_PRIVATE_KEY ||
      DEFAULT_DEV_RESULT_SECRET_PRIVATE_KEY
  );
  const token = await signJwt(
    {
      sessionPublicKey: sessionKeyPair.publicKeyStr,
      exp: Math.floor(Date.now() / 1000) + 300,
    },
    resultSecretPriv,
    "ES256"
  );

  const baseScore100 = params?.baseScore100 ?? 7000;
  const chainScore100 = params?.chainScore100 ?? 1500;
  const bigScore100 = params?.bigScore100 ?? 1500;
  const score100 =
    params?.score100 ?? baseScore100 + chainScore100 + bigScore100;

  const result: ResultSerialized = [
    4,
    serializeDate4(new Date()),
    "test-level",
    0,
    10,
    baseScore100,
    chainScore100,
    bigScore100,
    score100,
    [10, 5, 2, 1],
    20,
    1,
    params?.playbackRate4 ?? 4,
    params?.auto ?? false,
  ];

  const resultBytes = msgpack.encode(result);
  const sign = await signData(sessionKeyPair.privateKey, resultBytes);

  return {
    token,
    body: {
      result,
      sign,
      lvHash: await hash("dummy"),
      factor: params?.factor ?? 0.5,
      editing: params?.editing ?? false,
    },
  };
}

describe("POST /api/record/:cid", () => {
  test(
    "should return 429 for too many requests",
    {
      skip:
        process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT,
    },
    async () => {
      await initDb();
      const { body: payload1, token: token1 } = await createValidRecordData();
      const res1 = await app.request("/api/record/100000", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token1}`,
        },
        body: JSON.stringify(payload1),
      });
      expect(res1.status).to.equal(200);

      const { body: payload2, token: token2 } = await createValidRecordData();
      const res2 = await app.request("/api/record/100000", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token2}`,
        },
        body: JSON.stringify(payload2),
      });
      expect(res2.status).to.equal(429);
      const body = await res2.json();
      expect(body).to.deep.equal({ message: "tooManyRequest" });
    }
  );

  test("should store record and return ResultSecret signature for normal play", async () => {
    await initDb();
    const { body: payload, token } = await createValidRecordData({
      score100: 10000,
      baseScore100: 7000,
      chainScore100: 1500,
      bigScore100: 1500,
      factor: 0.5,
      editing: false,
      auto: false,
      playbackRate4: 4,
    });
    const res = await app.request("/api/record/100000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    expect(res.status).to.equal(200);
    const body = (await res.json()) as { sign: string | null };
    expect(body).to.have.property("sign");
    expect(body.sign).to.be.a("string");

    const record = await db
      .collection<PlayRecordEntry>("playRecord")
      .find({ $and: [{ cid: "100000" }, { lvHash: await hash("dummy") }] })
      .toArray();
    expect(record.length).to.equal(1);
    expect(record[0]).to.include({
      lvHash: await hash("dummy"),
      auto: false,
      score: 100,
      baseScore: 70,
      chainScore: 15,
      bigScore: 15,
      fc: false,
      factor: 0.5,
      editing: false,
    });
  });

  test("should not return signature for auto play", async () => {
    await initDb();
    const { body: payload, token } = await createValidRecordData({
      auto: true,
      playbackRate4: 4,
    });
    const res = await app.request("/api/record/100000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    expect(res.status).to.equal(200);
    const body = (await res.json()) as { sign: string | null };
    expect(body.sign).to.be.null;
  });

  test("should return signature but not save to DB when playbackRate !== 1", async () => {
    await initDb();
    const { body: payload, token } = await createValidRecordData({
      auto: false,
      playbackRate4: 6, // 1.5x speed
    });
    const res = await app.request("/api/record/100000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    expect(res.status).to.equal(200);
    const body = (await res.json()) as { sign: string | null };
    expect(body.sign).to.be.a("string");

    const record = await db
      .collection<PlayRecordEntry>("playRecord")
      .find({ $and: [{ cid: "100000" }, { lvHash: await hash("dummy") }] })
      .toArray();
    expect(record.length).to.equal(0);
  });

  test("should reject invalid token or signature", async () => {
    await initDb();
    const { body: payload } = await createValidRecordData();

    const res = await app.request("/api/record/100000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid-token",
      },
      body: JSON.stringify(payload),
    });
    expect(res.status).to.equal(400);
  });
});
