import { test, describe } from "node:test";
import { expect } from "chai";
import { app, getTestResultBuildKeyPair, dummyCid } from "./init.js";
import { sign, verify } from "hono/jwt";
import { resultSecretKey } from "../../src/env.js";

describe("POST /api/resultSigning/init", () => {
  test("should issue session token signed with ResultSecret", async () => {
    const sessionKeyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    const buildKeyPair = await getTestResultBuildKeyPair();
    const sessionPubJWK = await crypto.subtle.exportKey(
      "jwk",
      sessionKeyPair.publicKey
    );

    const buildToken = await sign(
      {
        key: sessionPubJWK,
        cid: dummyCid,
      },
      buildKeyPair.privateKey,
      "ES256"
    );

    const res = await app.request("/api/resultSigning/init", {
      method: "POST",
      body: buildToken,
    });

    expect(res.status).to.equal(200);

    const sessionToken = await res.text();
    const verifiedPayload = (await verify(
      sessionToken,
      await resultSecretKey(process.env as any),
      "HS256"
    )) as Record<string, unknown>;

    expect(verifiedPayload).to.have.property("cid", dummyCid);
    expect(verifiedPayload).to.have.property("key");
    expect(verifiedPayload.key).to.deep.equal(sessionPubJWK);
    expect(verifiedPayload).to.have.property("exp");
    expect(verifiedPayload.exp).to.be.closeTo(
      Math.floor(Date.now() / 1000) + 60 * 60 * 3,
      10
    );
  });

  test("should return 400 for invalid payload with valid signature", async () => {
    const sessionKeyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    const buildKeyPair = await getTestResultBuildKeyPair();

    const buildToken = await sign(
      { hello: "world" },
      buildKeyPair.privateKey,
      "ES256"
    );

    const res = await app.request("/api/resultSigning/init", {
      method: "POST",
      body: buildToken,
    });

    expect(res.status).to.equal(400);
  });

  test("should return 401 for invalid signature", async () => {
    const sessionKeyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    const anotherKeyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const buildToken = await sign(
      {
        key: await crypto.subtle.exportKey("jwk", sessionKeyPair.publicKey),
        cid: dummyCid,
      },
      anotherKeyPair.privateKey,
      "ES256"
    );

    const res = await app.request("/api/resultSigning/init", {
      method: "POST",
      body: buildToken,
    });

    expect(res.status).to.equal(401);
    const body = (await res.json()) as { message: string; cause?: string };
    expect(body).to.have.property("message", "unauthorizedResultBuildKey");
    expect(body).to.have.property("cause");
    expect(body.cause).to.be.a("string");
  });

  test("should return 401 for non-jwt body", async () => {
    const res = await app.request("/api/resultSigning/init", {
      method: "POST",
      body: "not-a-valid-jwt",
    });

    expect(res.status).to.equal(401);
    const body = (await res.json()) as { message: string; cause?: string };
    expect(body).to.have.property("message", "unauthorizedResultBuildKey");
    expect(body).to.have.property("cause");
    expect(body.cause).to.be.a("string");
  });
});
