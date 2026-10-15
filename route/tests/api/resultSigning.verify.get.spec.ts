import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyCid } from "./init.js";
import {
  ResultParams,
  serializeCid,
  serializeDate4,
  serializeResultParamsLegacy,
} from "@falling-nikochan/chart";
import { resultSecretKey } from "../../src/env.js";
import * as msgpack from "@msgpack/msgpack";

const testResultParams: ResultParams = {
  date: new Date(2026, 4, 1),
  lvName: "testLevel",
  lvType: 1,
  lvDifficulty: 10,
  baseScore100: 1000,
  chainScore100: 500,
  bigScore100: 500,
  score100: 2000,
  judgeCount: [10, 5, 2, 0],
  bigCount: 5,
  inputType: 1,
  playbackRate4: 4,
  cid: dummyCid,
};
const resultSerialized = Buffer.from(
  msgpack.encode([
    4,
    serializeDate4(testResultParams.date!),
    testResultParams.lvName,
    testResultParams.lvType,
    testResultParams.lvDifficulty,
    testResultParams.baseScore100,
    testResultParams.chainScore100,
    testResultParams.bigScore100,
    testResultParams.score100,
    testResultParams.judgeCount.slice(),
    testResultParams.bigCount,
    testResultParams.inputType,
    testResultParams.playbackRate4,
    serializeCid(testResultParams.cid!),
  ])
).toString("base64url");

describe("GET /api/resultSigning/verify/:cid", () => {
  test("should return 200 for valid signed result", async () => {
    const key = await resultSecretKey(process.env as any);
    const signature = await crypto.subtle.sign(
      { name: "HMAC", hash: { name: "SHA-256" } },
      key,
      Buffer.from(resultSerialized, "base64url")
    );
    const signatureBase64Url = Buffer.from(signature.slice(0, 12)).toString(
      "base64url"
    );
    const param = `${resultSerialized}.${signatureBase64Url}`;

    const res = await app.request(
      `/api/resultSigning/verify/${dummyCid}?result=${encodeURIComponent(param)}`
    );
    expect(res.status).to.equal(200);
  });

  test("should return 422 for tampered signature", async () => {
    const param = `${resultSerialized}.invalidSignature`;

    const res = await app.request(
      `/api/resultSigning/verify/${dummyCid}?result=${encodeURIComponent(param)}`
    );
    expect(res.status).to.equal(422);
  });

  test("should return 400 for legacy result version (ver < 4)", async () => {
    const legacySerialized = serializeResultParamsLegacy(testResultParams);
    const res = await app.request(
      `/api/resultSigning/verify/${dummyCid}?result=${encodeURIComponent(legacySerialized)}`
    );
    expect(res.status).to.equal(400);
  });

  test("should return 400 for invalid result parameter", async () => {
    const res = await app.request(
      `/api/resultSigning/verify/${dummyCid}?result=invalid-param`
    );
    expect(res.status).to.equal(400);
  });
});
