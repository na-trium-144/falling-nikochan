import { LevelEdit } from "../chart.js";
import { BPMChange } from "../bpm.js";
import { stepCmp } from "../step.js";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit.js";
import { Chart3 } from "../legacy/chart3.js";

function accelLuaCommand(bpm: number) {
  return `Accel(${bpm})`;
}
export function luaAddSpeedChange<L extends LevelEdit | Chart3>(
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

  lua = insertLua(chart, lua, insert.luaLine, accelLuaCommand(change.bpm));
  chart.speedChanges.push({ ...change, luaLine: insert.luaLine });
  chart.speedChanges = chart.speedChanges.sort((a, b) =>
    stepCmp(a.step, b.step)
  );
  return { chart, lua };
}
export function luaUpdateSpeedChange(
  chart: LevelEdit,
  lua: string[],
  index: number,
  bpm: number
): { chart: LevelEdit; lua: string[] } | null {
  if (chart.speedChanges[index].luaLine === null) {
    return null;
  }
  lua = replaceLua(
    chart,
    lua,
    chart.speedChanges[index].luaLine,
    accelLuaCommand(bpm)
  );
  chart.speedChanges[index].bpm = bpm;
  // updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return { chart, lua };
}
export function luaDeleteSpeedChange(
  chart: LevelEdit,
  lua: string[],
  index: number
): { chart: LevelEdit; lua: string[] } | null {
  if (chart.speedChanges[index].luaLine === null) {
    return null;
  }
  lua = deleteLua(chart, lua, chart.speedChanges[index].luaLine);
  chart.speedChanges = chart.speedChanges.filter((_ch, i) => i !== index);
  // updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return { chart, lua };
}
