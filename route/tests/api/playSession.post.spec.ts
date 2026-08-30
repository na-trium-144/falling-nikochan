import { test, describe } from "node:test";
import { expect } from "chai";
import { app } from "./init";
import {
  generateKeyPair,
  importPrivateKey,
  importPublicKey,
  DEFAULT_RESULT_SECRET_PUBLIC_KEY,
} from "@falling-nikochan/chart";
import { sign, verify } from "hono/jwt";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("POST /api/playSession", () => {
  test("should issue a JWT token signed with ResultSecret when valid BuildKey JWT is provided", async () => {
    let buildKeyJson: {
      privateKeyStr: string;
      publicKeyStr: string;
    } | null = null;
    const paths = [
      join(process.cwd(), "frontend/.buildKey.json"),
      join(process.cwd(), "../frontend/.buildKey.json"),
      join(process.cwd(), ".buildKey.json"),
    ];
    for (const p of paths) {
      try {
        buildKeyJson = JSON.parse(readFileSync(p, "utf8"));
        break;
      } catch {
        // continue
      }
    }
    if (!buildKeyJson) {
      const generated = await generateKeyPair();
      buildKeyJson = {
        privateKeyStr: generated.privateKeyStr,
        publicKeyStr: generated.publicKeyStr,
      };
    }

    const sessionKeyPair = await generateKeyPair();
    const buildPrivKey = await importPrivateKey(buildKeyJson.privateKeyStr);
    const buildToken = await sign(
      {
        sessionPublicKey: sessionKeyPair.publicKeyStr,
        exp: Math.floor(Date.now() / 1000) + 300,
      },
      buildPrivKey,
      "ES256"
    );

    const res = await app.request("/api/playSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: buildToken,
      }),
    });

    expect(res.status).to.equal(200);
    const body = (await res.json()) as { token: string };
    expect(body).to.have.property("token");

    // Token must be validly signed with ResultSecret JWT
    const resultSecretPub = await importPublicKey(
      process.env.RESULT_SECRET_PUBLIC_KEY || DEFAULT_RESULT_SECRET_PUBLIC_KEY
    );
    const payload = (await verify(body.token, resultSecretPub, "ES256")) as {
      sessionPublicKey: string;
    };
    expect(payload.sessionPublicKey).to.equal(sessionKeyPair.publicKeyStr);
  });

  test("should reject invalid BuildKey JWT", async () => {
    const res = await app.request("/api/playSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "invalid.jwt.token",
      }),
    });

    expect(res.status).to.equal(400);
  });
});
