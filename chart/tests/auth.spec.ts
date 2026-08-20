import { test, describe } from "node:test";
import { expect } from "chai";
import {
  generateKeyPair,
  signData,
  verifyData,
  verifyResultParam,
  serializeResultParams,
  ResultParams,
  DEFAULT_RESULT_SECRET_PUBLIC_KEY,
  DEFAULT_DEV_RESULT_SECRET_PRIVATE_KEY,
  serializeDate3,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";

describe("auth", () => {
  test("should generate keypair, sign and verify", async () => {
    const keyPair = await generateKeyPair();
    const message = "test-message-12345";
    const signature = await signData(keyPair.privateKey, message);
    const valid = await verifyData(keyPair.publicKey, signature, message);
    expect(valid).to.be.true;

    const invalidMessage = "wrong-message";
    const invalid = await verifyData(
      keyPair.publicKey,
      signature,
      invalidMessage
    );
    expect(invalid).to.be.false;
  });

  test("should sign with DEFAULT_DEV_RESULT_SECRET_PRIVATE_KEY and verify with DEFAULT_RESULT_SECRET_PUBLIC_KEY", async () => {
    const message = new Uint8Array([1, 2, 3, 4, 5]);
    const signature = await signData(
      DEFAULT_DEV_RESULT_SECRET_PRIVATE_KEY,
      message
    );
    const valid = await verifyData(
      DEFAULT_RESULT_SECRET_PUBLIC_KEY,
      signature,
      message
    );
    expect(valid).to.be.true;
  });

  test("should verify result params ver 4 with signature", async () => {
    const params: ResultParams = {
      date: new Date(2026, 4, 1),
      lvName: "test-level",
      lvType: 0,
      lvDifficulty: 10,
      baseScore100: 5000,
      chainScore100: 1000,
      bigScore100: 1000,
      score100: 7000,
      judgeCount: [10, 5, 2, 1],
      bigCount: 20,
      inputType: 1,
      playbackRate4: 4,
      auto: false,
    };
    const serialized = serializeResultParams(params);

    // Decode serialized back to bytes for signing (as Done by server/client)
    const serializedBin = atob(
      serialized.replaceAll("-", "+").replaceAll("_", "/")
    );
    const serializedArr = new Uint8Array(serializedBin.length);
    for (let i = 0; i < serializedBin.length; i++) {
      serializedArr[i] = serializedBin.charCodeAt(i);
    }

    const signature = await signData(
      DEFAULT_DEV_RESULT_SECRET_PRIVATE_KEY,
      serializedArr
    );

    // Valid signature with ResultSecret
    const valid = await verifyResultParam(
      serialized,
      signature,
      DEFAULT_RESULT_SECRET_PUBLIC_KEY
    );
    expect(valid).to.be.true;

    // Missing signature on ver 4 should fail
    const missingSign = await verifyResultParam(
      serialized,
      null,
      DEFAULT_RESULT_SECRET_PUBLIC_KEY
    );
    expect(missingSign).to.be.false;

    // Invalid signature on ver 4 should fail
    const invalidSign = await verifyResultParam(
      serialized,
      "invalid-signature",
      DEFAULT_RESULT_SECRET_PUBLIC_KEY
    );
    expect(invalidSign).to.be.false;
  });

  test("should allow ver 3 result params without signature (backwards compatibility)", async () => {
    const params: ResultParams = {
      date: new Date(2026, 4, 1),
      lvName: "test-level-v3",
      lvType: 0,
      lvDifficulty: 10,
      baseScore100: 5000,
      chainScore100: 1000,
      bigScore100: 1000,
      score100: 7000,
      judgeCount: [10, 5, 2, 1],
      bigCount: 20,
      inputType: 1,
      playbackRate4: 4,
    };
    const serializedVer3 = msgpack.encode([
      3,
      serializeDate3(params.date!),
      params.lvName,
      params.lvType,
      params.lvDifficulty,
      params.baseScore100,
      params.chainScore100,
      params.bigScore100,
      params.score100,
      params.judgeCount.slice(),
      params.bigCount,
      params.inputType,
      params.playbackRate4,
    ]);
    let bin = "";
    for (let i = 0; i < serializedVer3.length; i++) {
      bin += String.fromCharCode(serializedVer3[i]);
    }
    const strVer3 = btoa(bin)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

    // ver 3 without signature should pass
    const validNoSign = await verifyResultParam(
      strVer3,
      null,
      DEFAULT_RESULT_SECRET_PUBLIC_KEY
    );
    expect(validNoSign).to.be.true;
  });
});
