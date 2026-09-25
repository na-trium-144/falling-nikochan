import { test, describe } from "node:test";
import { expect } from "chai";
import { app, createTestResultSigning, dummyCid } from "./init.js";
import { ResultParams, serializeResultParams } from "@falling-nikochan/chart";
import { resultSecretKey } from "../../src/env.js";
import { decodeBase64Url } from "hono/utils/encode";

const testResultParams: ResultParams = {
  date: new Date(),
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

describe("POST /api/resultSigning/sign", () => {
  test("should sign play result with ResultSecret key", async () => {
    const { sessionToken, sessionKeyPair } =
      await createTestResultSigning(dummyCid);

    const resultSerialized = serializeResultParams(testResultParams);
    const clientSign = await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      sessionKeyPair.privateKey,
      Buffer.from(resultSerialized, "base64url")
    );

    const res = await app.request("/api/resultSigning/sign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        result: resultSerialized,
        clientSign: Buffer.from(clientSign).toString("base64url"),
      }),
    });

    expect(res.status).to.equal(200);
    const body = await res.json();

    expect(
      await crypto.subtle.verify(
        { name: "HMAC", hash: { name: "SHA-256" } },
        await resultSecretKey(process.env as any),
        decodeBase64Url(body.sign),
        decodeBase64Url(resultSerialized)
      )
    ).to.be.true;
  });

  test("should return 401 when Authorization is missing", async () => {
    const resultSerialized = serializeResultParams(testResultParams);
    const res = await app.request("/api/resultSigning/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result: resultSerialized,
        clientSign: "dummyClientSign",
      }),
    });
    expect(res.status).to.equal(401);
  });

  test("should return 422 when client signature is invalid", async () => {
    const { sessionToken } = await createTestResultSigning(dummyCid);
    const anotherKeyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const resultSerialized = serializeResultParams(testResultParams);
    const clientSign = await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      anotherKeyPair.privateKey,
      Buffer.from(resultSerialized, "base64url")
    );

    const res = await app.request("/api/resultSigning/sign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        result: resultSerialized,
        clientSign: Buffer.from(clientSign).toString("base64url"),
      }),
    });
    expect(res.status).to.equal(422);
  });

  test("should return 422 when cid is different", async () => {
    const { sessionToken, sessionKeyPair } = await createTestResultSigning(
      String(Number(dummyCid) + 1)
    );

    const resultSerialized = serializeResultParams(testResultParams);
    const clientSign = await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      sessionKeyPair.privateKey,
      Buffer.from(resultSerialized, "base64url")
    );

    const res = await app.request("/api/resultSigning/sign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        result: resultSerialized,
        clientSign: Buffer.from(clientSign).toString("base64url"),
      }),
    });

    expect(res.status).to.equal(422);
  });

  /*test("should return 422 when date is older than 5 minutes", async () => {
    const { sessionToken, sessionKeyPair } =
      await createTestResultSigning(dummyCid);

    const oldResultParams: ResultParams = {
      ...testResultParams,
      date: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    };
    const resultSerialized = serializeResultParams(oldResultParams);
    const clientSign = await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      sessionKeyPair.privateKey,
      Buffer.from(resultSerialized, "base64url")
    );

    const res = await app.request("/api/resultSigning/sign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        result: resultSerialized,
        clientSign: Buffer.from(clientSign).toString("base64url"),
      }),
    });
    expect(res.status).to.equal(422);
  });*/

  test("should return 400 for invalid result format", async () => {
    const { sessionToken, sessionKeyPair } =
      await createTestResultSigning(dummyCid);

    const invalidResult = "not-a-valid-base64url-result";
    const clientSign = await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      sessionKeyPair.privateKey,
      Buffer.from(invalidResult, "base64url")
    );

    const res = await app.request("/api/resultSigning/sign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        result: invalidResult,
        clientSign: Buffer.from(clientSign).toString("base64url"),
      }),
    });
    expect(res.status).to.equal(400);
  });
});
