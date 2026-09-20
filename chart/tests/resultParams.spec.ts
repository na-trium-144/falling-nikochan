import { test, describe } from "node:test";
import { expect } from "chai";
import {
  deserializeResultParams,
  isVerificationRequired,
  ResultParams,
  serializeDate3,
  serializeDate4,
  serializeResultParams,
  serializeResultParamsLegacy,
  verifyResultParams,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { encodeBase64Url } from "hono/utils/encode";

const expectedParams = {
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
  test("should parse current result params (version 4)", async () => {
    const serialized = serializeResultParams(expectedParams);
    const deserialized = deserializeResultParams(serialized);
    expect(deserialized).to.be.deep.equal(expectedParams);
  });

  test("should parse result params version 3", async () => {
    const serialized = msgpack.encode([
      3,
      serializeDate3(expectedParams.date),
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
    const serializedBase64 = encodeBase64Url(serialized);

    expect(serializedBase64).to.be.equal(
      serializeResultParamsLegacy(expectedParams)
    );

    const deserialized = deserializeResultParams(serializedBase64);
    expect(deserialized).to.be.deep.equal({
      ...expectedParams,
      cid: null,
    } satisfies ResultParams);
  });

  test("should parse result params version 4", async () => {
    const serialized = msgpack.encode([
      4,
      serializeDate4(expectedParams.date),
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
    const serializedBase64 = encodeBase64Url(serialized);

    const deserialized = deserializeResultParams(serializedBase64);
    expect(deserialized).to.be.deep.equal(expectedParams);
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
    const serializedBase64 = encodeBase64Url(serialized);

    const deserialized = deserializeResultParams(serializedBase64);
    expect(deserialized).to.be.deep.equal({
      ...expectedParams,
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
    const serializedBase64 = encodeBase64Url(serialized);

    const deserialized = deserializeResultParams(serializedBase64);
    expect(deserialized).to.be.deep.equal({
      ...expectedParams,
      inputType: null,
      playbackRate4: 4,
      cid: null,
    } satisfies ResultParams);
  });
});
