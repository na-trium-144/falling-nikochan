import { test, describe } from "node:test";
import { expect } from "chai";
import {
  ChartEditSchema14,
  chartToLuaTableCode,
  findLuaLevelCode,
} from "@falling-nikochan/chart";
import { dummyChartData } from "./editing/dummy";
import { LuaFactory } from "wasmoon";
import * as v from "valibot";
import { readFile } from "node:fs/promises";

const fnCommandsVer = JSON.parse(
  await readFile(
    import.meta.resolve("fn-commands/package.json").replace("file://", ""),
    { encoding: "utf8" }
  )
).version;

describe("luaTable", () => {
  test("should restore Chart14Edit except for lua by executing luaTable", async () => {
    const code = chartToLuaTableCode(dummyChartData, fnCommandsVer);
    const factory = new LuaFactory();
    await factory.mountFile(
      "/usr/local/share/lua/5.4/fn-commands.lua",
      await readFile(
        import.meta.resolve("fn-commands").replace("file://", ""),
        { encoding: "utf8" }
      )
    );
    const lua = await factory.createEngine();
    const result = await lua.doString(code);
    console.log(result);
    v.parse(ChartEditSchema14(), { ...result, lua: dummyChartData.lua });
  });
  test("should restore original lua code with findLuaLevelCode()", () => {
    const code = chartToLuaTableCode(dummyChartData, fnCommandsVer);
    const parsedLua = findLuaLevelCode(code);
    expect(parsedLua).to.be.lengthOf(dummyChartData.lua.length);
    expect(parsedLua.at(0)).to.be.deep.equal(dummyChartData.lua.at(0));
  });
});
