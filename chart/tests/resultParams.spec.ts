import { test, describe } from "node:test";
import { expect } from "chai";
import {
  deserializeResultParams,
  isVerificationRequired,
  parseResultParams,
  ResultParams,
  serializeDate,
  serializeResultParams,
  serializeResultParamsLegacy,
  verifyResultParams,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { decodeBase64Url, encodeBase64Url } from "hono/utils/encode";

const expectedParams = {
  ver: 4,
  date: new Date(2026, 4, 1),
  lvName: "abcあいうえお",
  lvType: 1,
  lvDifficulty: 15,
  baseScore100: 1234,
  chainScore100: 567,
  bigScore100: 890,
  score100: 1234 + 567 + 890,
  judgeCount: [1, 2, 3, 4],
  bigCount: 50,
  inputType: 1,
  playbackRate4: 8,
  cid: "123456",
} as const satisfies ResultParams;

describe("resultParams", () => {
  describe("deserializeResultParams", () => {
    test("should parse current result params", async () => {
      const serialized = serializeResultParams(expectedParams);
      const deserialized = deserializeResultParams(decodeBase64Url(serialized));
      expect(deserialized).to.be.deep.equal(expectedParams);
    });

    test("should parse result params version 4", async () => {
      const dateBase4 = new Date(2026, 10, 1);
      const serialized = msgpack.encode([
        4,
        serializeDate(expectedParams.date, dateBase4),
        expectedParams.lvName,
        expectedParams.lvType,
        expectedParams.lvDifficulty,
        expectedParams.baseScore100,
        expectedParams.chainScore100,
        expectedParams.bigScore100,
        expectedParams.score100,
        expectedParams.judgeCount.slice(),
        expectedParams.bigCount,
        expectedParams.inputType,
        expectedParams.playbackRate4,
        expectedParams.cid,
      ]);

      const deserialized = deserializeResultParams(serialized);
      expect(deserialized).to.be.deep.equal(expectedParams);
    });

    test("should parse result params version 3", async () => {
      const dateBase = new Date(2025, 2, 1);
      const serialized = msgpack.encode([
        3,
        serializeDate(expectedParams.date, dateBase),
        expectedParams.lvName,
        expectedParams.lvType,
        expectedParams.lvDifficulty,
        expectedParams.baseScore100,
        expectedParams.chainScore100,
        expectedParams.bigScore100,
        expectedParams.score100,
        expectedParams.judgeCount.slice(),
        expectedParams.bigCount,
        expectedParams.inputType,
        expectedParams.playbackRate4,
      ]);

      const serializedBase64 = Buffer.from(serialized).toString("base64url");
      expect(serializedBase64).to.be.equal(
        serializeResultParamsLegacy(expectedParams)
      );

      const deserialized = deserializeResultParams(serialized);
      expect(deserialized).to.be.deep.equal({
        ...expectedParams,
        ver: 3,
        cid: null,
      } satisfies ResultParams);
    });

    test("should parse result params version 2", async () => {
      const dateBase = new Date(2025, 2, 1);
      const serialized = msgpack.encode([
        2,
        expectedParams.date.getTime() - dateBase.getTime(),
        expectedParams.lvName,
        expectedParams.lvType,
        expectedParams.lvDifficulty,
        expectedParams.baseScore100,
        expectedParams.chainScore100,
        expectedParams.bigScore100,
        expectedParams.score100,
        expectedParams.judgeCount.slice(),
        expectedParams.bigCount,
        expectedParams.inputType,
      ]);

      const deserialized = deserializeResultParams(serialized);
      expect(deserialized).to.be.deep.equal({
        ...expectedParams,
        ver: 2,
        playbackRate4: 4,
        cid: null,
      } satisfies ResultParams);
    });

    test("should parse result params version 1", async () => {
      const dateBase = new Date(2025, 2, 1);
      const serialized = msgpack.encode([
        1,
        expectedParams.date.getTime() - dateBase.getTime(),
        expectedParams.lvName,
        expectedParams.lvType,
        expectedParams.lvDifficulty,
        expectedParams.baseScore100,
        expectedParams.chainScore100,
        expectedParams.bigScore100,
        expectedParams.score100,
        expectedParams.judgeCount.slice(),
        expectedParams.bigCount,
      ]);

      const deserialized = deserializeResultParams(serialized);
      expect(deserialized).to.be.deep.equal({
        ...expectedParams,
        ver: 1,
        inputType: null,
        playbackRate4: 4,
        cid: null,
      } satisfies ResultParams);
    });
  });

  describe("parseResultParams", () => {
    test("should split result and sign combined with dot notation", async () => {
      const dummyResult = new Uint8Array([0x92, 2, 3]).buffer;
      const dummySign = new Uint8Array([4, 5, 6]).buffer;
      const param =
        encodeBase64Url(dummyResult) + "." + encodeBase64Url(dummySign);
      const { result, sign } = await parseResultParams(param);
      expect(encodeBase64Url(result.buffer)).to.be.equal(
        encodeBase64Url(dummyResult)
      );
      expect(encodeBase64Url(sign!.buffer)).to.be.equal(
        encodeBase64Url(dummySign)
      );
    });
    test("should ignore non-base64url characters", async () => {
      const dummyResult = new Uint8Array([0x92, 2, 3]).buffer;
      const dummySign = new Uint8Array([4, 5, 6]).buffer;
      const param =
        encodeBase64Url(dummyResult) +
        "!#$%.&'" +
        encodeBase64Url(dummySign) +
        "あいうえお";
      const { result, sign } = await parseResultParams(param);
      expect(encodeBase64Url(result.buffer)).to.be.equal(
        encodeBase64Url(dummyResult)
      );
      expect(encodeBase64Url(sign!.buffer)).to.be.equal(
        encodeBase64Url(dummySign)
      );
    });
    test("should return as result if parameter does not contain dot", async () => {
      const dummyResult = new Uint8Array([0x92, 2, 3]).buffer;
      const param = encodeBase64Url(dummyResult);
      const { result, sign } = await parseResultParams(param);
      expect(encodeBase64Url(result.buffer)).to.be.equal(
        encodeBase64Url(dummyResult)
      );
      expect(sign).to.be.undefined;
    });
    test("should reject invalid start bytes", async () => {
      const dummyResult = new Uint8Array([0xff, 2, 3]).buffer;
      const param = encodeBase64Url(dummyResult);
      try {
        await parseResultParams(param);
        expect.fail("parseResultParams did not throw");
      } catch (e) {
        expect(String(e)).to.includes("ff");
      }
    });
  });

  describe("verifyResultParams", () => {
    test("should verify valid signed result", async () => {
      const key = await crypto.subtle.generateKey(
        { name: "HMAC", hash: { name: "SHA-256" } },
        true,
        ["sign", "verify"]
      );

      const result = msgpack.encode(expectedParams);
      const sign = new Uint8Array(
        await crypto.subtle.sign(
          { name: "HMAC", hash: { name: "SHA-256" } },
          key,
          result
        )
      );

      const verified = await verifyResultParams({ result, sign }, key);
      expect(verified).to.be.true;
    });

    test("should return false for tampered signature", async () => {
      const key = await crypto.subtle.generateKey(
        { name: "HMAC", hash: { name: "SHA-256" } },
        true,
        ["sign", "verify"]
      );

      const result = msgpack.encode(expectedParams);
      const sign = new Uint8Array([1, 2, 3, 4, 5]);

      const verified = await verifyResultParams({ result, sign }, key);
      expect(verified).to.be.false;
    });

    test("should return false for tampered result content", async () => {
      const key = await crypto.subtle.generateKey(
        { name: "HMAC", hash: { name: "SHA-256" } },
        true,
        ["sign", "verify"]
      );

      const result = msgpack.encode(expectedParams);
      const sign = new Uint8Array(
        await crypto.subtle.sign(
          { name: "HMAC", hash: { name: "SHA-256" } },
          key,
          result
        )
      );

      const tamperedResult = msgpack.encode({
        ...expectedParams,
        score100: 99999,
      });

      const verified = await verifyResultParams(
        { result: tamperedResult, sign },
        key
      );
      expect(verified).to.be.false;
    });

    test("should return false for unsigned result format", async () => {
      const key = await crypto.subtle.generateKey(
        { name: "HMAC", hash: { name: "SHA-256" } },
        true,
        ["sign", "verify"]
      );

      const result = msgpack.encode(expectedParams);

      const verified = await verifyResultParams({ result }, key);
      expect(verified).to.be.false;
    });
  });
});
