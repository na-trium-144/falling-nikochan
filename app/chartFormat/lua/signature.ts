import { Level } from "../chart";
import { Signature, updateBarNum } from "../command";
import { stepCmp } from "../step";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit";

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
      .map((bar) => "{" + bar.join(",") + "}")
      .join(".")}})`;
  } else {
    return `Beat({${s.bars
      .map((bar) => "{" + bar.join(",") + "}")
      .join(".")}}, ${num}, ${denom})`;
  }
}
export function luaAddBeatChange(chart: Level, change: Signature) {
  const insert = findInsertLine(chart, change.step);
  if (insert.luaLine === null) {
    return null;
  }
  chart = insert.chart;
  insertLua(chart, insert.luaLine, beatLuaCommand(change));
  chart.signature.push({ ...change, luaLine: insert.luaLine });
  chart.signature = chart.signature.sort((a, b) => stepCmp(a.step, b.step));
  updateBarNum(chart.signature);
  return chart;
}
export function luaUpdateBeatChange(
  chart: Level,
  index: number,
  change: Signature
) {
  if (chart.signature[index].luaLine === null) {
    return null;
  }
  replaceLua(chart, chart.signature[index].luaLine, beatLuaCommand(change));
  chart.signature[index] = {
    ...change,
    luaLine: chart.signature[index].luaLine,
  };
  updateBarNum(chart.signature);
  return chart;
}
export function luaDeleteBeatChange(chart: Level, index: number) {
  if (chart.signature[index].luaLine === null) {
    return null;
  }
  deleteLua(chart, chart.signature[index].luaLine);
  chart.signature = chart.signature.filter((_ch, i) => i !== index);
  updateBarNum(chart.signature);
  return chart;
}