import { test, describe } from "node:test";
import { expect } from "chai";
import { app } from "./init.js";
import { DEFAULT_RESULT_SECRET_PUBLIC_KEY } from "@falling-nikochan/chart";

describe("GET /api/resultPublicKey", () => {
  test("should return the ResultSecret public key", async () => {
    const res = await app.request("/api/resultPublicKey");
    expect(res.status).to.equal(200);
    const body = (await res.json()) as { publicKey: string };
    expect(body).to.have.property("publicKey");
    expect(body.publicKey).to.equal(
      process.env.RESULT_SECRET_PUBLIC_KEY || DEFAULT_RESULT_SECRET_PUBLIC_KEY
    );
  });
});
