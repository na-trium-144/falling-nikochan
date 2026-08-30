import { test, describe } from "node:test";
import { expect } from "chai";
import { app } from "./init.js";
import { resultSecretPubKey } from "../../src/env.js";

describe("GET /api/playSession/publicKey", () => {
  test("should return the ResultSecret public key", async () => {
    const res = await app.request("/api/resultPublicKey");
    expect(res.status).to.equal(200);
    const body = await res.json();
    expect(body).to.have.property("keys");
    expect(body.keys[0]).to.deep.equal(
      await crypto.subtle.exportKey(
        "jwk",
        await resultSecretPubKey(process.env as any)
      )
    );
  });
});
