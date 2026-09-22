import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyCid } from "./init.js";
import {
  ResultParams,
  serializeResultParams,
  serializeResultParamsLegacy,
} from "@falling-nikochan/chart";
import { resultSecretPrivKey } from "../../src/env.js";

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

describe("GET /api/playSession/verify", () => {
  test("should return 204 for valid signed result", async () => {
    const serialized = serializeResultParams(testResultParams);
    const privKey = await resultSecretPrivKey(process.env as any);
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      privKey,
      Buffer.from(serialized, "base64url")
    );
    const signatureBase64Url = Buffer.from(signature).toString("base64url");
    const param = `${serialized}.${signatureBase64Url}`;

    const res = await app.request(
      `/api/playSession/verify?result=${encodeURIComponent(param)}`
    );
    expect(res.status).to.equal(204);
  });

  test("should return 422 for tampered signature", async () => {
    const serialized = serializeResultParams(testResultParams);
    const param = `${serialized}.invalidSignature`;

    const res = await app.request(
      `/api/playSession/verify?result=${encodeURIComponent(param)}`
    );
    expect(res.status).to.equal(422);
  });

  test("should return 409 for legacy result version (ver < 4)", async () => {
    const legacySerialized = serializeResultParamsLegacy(testResultParams);
    const res = await app.request(
      `/api/playSession/verify?result=${encodeURIComponent(legacySerialized)}`
    );
    expect(res.status).to.equal(409);
  });

  test("should return 400 for invalid result parameter", async () => {
    const res = await app.request(
      `/api/playSession/verify?result=invalid-param`
    );
    expect(res.status).to.equal(400);
  });
});
