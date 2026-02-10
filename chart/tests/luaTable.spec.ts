import { test, describe } from "node:test";
import { expect } from "chai";
import {
  chartToLuaTableCode,
  findLuaLevelCode,
  LuaTableSchema,
} from "@falling-nikochan/chart";
import { dummyChartData } from "./editing/dummy";
import { LuaFactory } from "wasmoon";
import * as v from "valibot";

describe("luaTable", () => {
  test("should restore identical metadata by executing luaTable", async () => {
    const code = chartToLuaTableCode(dummyChartData);
    const factory = new LuaFactory();
    const lua = await factory.createEngine();
    const result = await lua.doString(code);
    v.parse(LuaTableSchema(), result);
  });
  test("should restore original lua code with findLuaLevelCode()", () => {
    const code = chartToLuaTableCode(dummyChartData);
    const parsedLua = findLuaLevelCode(code);
    expect(parsedLua).to.be.lengthOf(dummyChartData.lua.length);
    expect(parsedLua.at(0)).to.be.deep.equal(dummyChartData.lua.at(0));
  });
});
