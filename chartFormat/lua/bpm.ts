import { LevelEdit } from "../chart.js";
import { BPMChange, updateBpmTimeSec } from "../bpm.js";
import { stepCmp } from "../step.js";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit.js";
import { Chart3 } from "../legacy/chart3.js";

function bpmLuaCommand(bpm: number) {
  return `BPM(${bpm})`;
}
export function luaAddBpmChange<L extends LevelEdit | Chart3>(
  chart: L,
  lua: string[],
  change: BPMChange
): { chart: L; lua: string[] } | null {
  const insert = findInsertLine(chart, lua, change.step);
  if (insert.luaLine === null) {
    return null;
  }
  chart = insert.chart;
  lua = insert.lua;
  lua = insertLua(chart, lua, insert.luaLine, bpmLuaCommand(change.bpm));
  chart.bpmChanges.push({ ...change, luaLine: insert.luaLine });
  chart.bpmChanges = chart.bpmChanges.sort((a, b) => stepCmp(a.step, b.step));
  return { chart, lua };
}
export function luaUpdateBpmChange(
  chart: LevelEdit,
  lua: string[],
  index: number,
  bpm: number
): { chart: LevelEdit; lua: string[] } | null {
  if (chart.bpmChanges[index].luaLine === null) {
    return null;
  }
  lua = replaceLua(
    chart,
    lua,
    chart.bpmChanges[index].luaLine,
    bpmLuaCommand(bpm)
  );
  chart.bpmChanges[index].bpm = bpm;
  updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return { chart, lua };
}
export function luaDeleteBpmChange(
  chart: LevelEdit,
  lua: string[],
  index: number
): { chart: LevelEdit; lua: string[] } | null {
  if (chart.bpmChanges[index].luaLine === null) {
    return null;
  }
  lua = deleteLua(chart, lua, chart.bpmChanges[index].luaLine);
  chart.bpmChanges = chart.bpmChanges.filter((_ch, i) => i !== index);
  updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return { chart, lua };
}
