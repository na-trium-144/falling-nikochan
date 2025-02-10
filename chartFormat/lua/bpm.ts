import { Level } from "../chart.js";
import { BPMChange, updateBpmTimeSec } from "../bpm.js";
import { stepCmp } from "../step.js";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit.js";
import { Chart3 } from "../legacy/chart3.js";

function bpmLuaCommand(bpm: number) {
  return `BPM(${bpm})`;
}
export function luaAddBpmChange<L extends Level | Chart3>(
  chart: L,
  change: BPMChange
): L | null {
  const insert = findInsertLine(chart, change.step);
  if (insert.luaLine === null) {
    return null;
  }
  chart = insert.chart;
  insertLua(chart, insert.luaLine, bpmLuaCommand(change.bpm));
  chart.bpmChanges.push({ ...change, luaLine: insert.luaLine });
  chart.bpmChanges = chart.bpmChanges.sort((a, b) => stepCmp(a.step, b.step));
  return chart;
}
export function luaUpdateBpmChange(chart: Level, index: number, bpm: number) {
  if (chart.bpmChanges[index].luaLine === null) {
    return null;
  }
  replaceLua(chart, chart.bpmChanges[index].luaLine, bpmLuaCommand(bpm));
  chart.bpmChanges[index].bpm = bpm;
  updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return chart;
}
export function luaDeleteBpmChange(chart: Level, index: number) {
  if (chart.bpmChanges[index].luaLine === null) {
    return null;
  }
  deleteLua(chart, chart.bpmChanges[index].luaLine);
  chart.bpmChanges = chart.bpmChanges.filter((_ch, i) => i !== index);
  updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return chart;
}
