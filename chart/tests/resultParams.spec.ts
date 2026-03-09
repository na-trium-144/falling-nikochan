import { test, describe } from "node:test";
import { expect } from "chai";
import {
  deserializeResultParams,
  ResultParams,
  serializeDate3,
  serializeResultParams,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";

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
} as const satisfies ResultParams;

describe("resultParams", () => {
  test("should parse current result params", async () => {
    const serialized = serializeResultParams(expectedParams);
    const deserialized = deserializeResultParams(serialized);
    expect(deserialized).to.be.deep.equal(expectedParams);
  });

  test("should parse result params version 3", async () => {
    const dateBase = new Date(2025, 2, 1);
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
    let serializedBin = "";
    for (let i = 0; i < serialized.length; i++) {
      serializedBin += String.fromCharCode(serialized[i]);
    }
    const serializedBase64 = btoa(serializedBin)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

    // current version
    expect(serializedBase64).to.be.equal(serializeResultParams(expectedParams));

    const deserialized = deserializeResultParams(serializedBase64);
    expect(deserialized).to.be.deep.equal({
      ...expectedParams,
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
    let serializedBin = "";
    for (let i = 0; i < serialized.length; i++) {
      serializedBin += String.fromCharCode(serialized[i]);
    }
    const serializedBase64 = btoa(serializedBin)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

    const deserialized = deserializeResultParams(serializedBase64);
    expect(deserialized).to.be.deep.equal({
      ...expectedParams,
      playbackRate4: 4,
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
    let serializedBin = "";
    for (let i = 0; i < serialized.length; i++) {
      serializedBin += String.fromCharCode(serialized[i]);
    }
    const serializedBase64 = btoa(serializedBin)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

    const deserialized = deserializeResultParams(serializedBase64);
    expect(deserialized).to.be.deep.equal({
      ...expectedParams,
      inputType: null,
      playbackRate4: 4,
    } satisfies ResultParams);
  });
});
