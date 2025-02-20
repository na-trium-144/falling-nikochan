import { LevelEdit } from "../chart.js";
import { Signature, updateBarNum } from "../signature.js";
import { Level5 } from "../legacy/chart5.js";
import { stepCmp } from "../step.js";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit.js";

function beatLuaCommand(s: Signature) {
  let num = s.offset.fourth * s.offset.denominator + s.offset.numerator;
  let denom = s.offset.denominator * 4;
  for (let i = 2; i <= num && i <= denom; i++) {
    while (num % i == 0 && denom % i == 0 && denom / i >= 4) {
      num /= i;
      denom /= i;
    }
  }
  if (num === 0) {
    return `Beat({${s.bars
      .map((bar) => "{" + bar.join(", ") + "}")
      .join(", ")}})`;
  } else {
    return `Beat({${s.bars
      .map((bar) => "{" + bar.join(", ") + "}")
      .join(", ")}}, ${num}, ${denom})`;
  }
}
export function luaAddBeatChange<L extends LevelEdit | Level5>(
  chart: L,
  lua: string[],
  change: Signature
): { chart: L; lua: string[] } | null {
  const insert = findInsertLine(chart, lua, change.step);
  if (insert.luaLine === null) {
    return null;
  }
  chart = insert.chart;
  lua = insert.lua;
  lua = insertLua(chart, lua, insert.luaLine, beatLuaCommand(change));
  chart.signature.push({ ...change, luaLine: insert.luaLine });
  chart.signature = chart.signature.sort((a, b) => stepCmp(a.step, b.step));
  updateBarNum(chart.signature);
  return { chart, lua };
}
export function luaUpdateBeatChange(
  chart: LevelEdit,
  lua: string[],
  index: number,
  change: Signature
): { chart: LevelEdit; lua: string[] } | null {
  if (chart.signature[index].luaLine === null) {
    return null;
  }
  lua = replaceLua(
    chart,
    lua,
    chart.signature[index].luaLine,
    beatLuaCommand(change)
  );
  chart.signature[index] = {
    ...change,
    luaLine: chart.signature[index].luaLine,
  };
  updateBarNum(chart.signature);
  return { chart, lua };
}
export function luaDeleteBeatChange(
  chart: LevelEdit,
  lua: string[],
  index: number
): { chart: LevelEdit; lua: string[] } | null {
  if (chart.signature[index].luaLine === null) {
    return null;
  }
  lua = deleteLua(chart, lua, chart.signature[index].luaLine);
  chart.signature = chart.signature.filter((_ch, i) => i !== index);
  updateBarNum(chart.signature);
  return { chart, lua };
}
