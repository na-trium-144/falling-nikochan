import { LevelEdit } from "../chart.js";
import { BPMChange } from "../bpm.js";
import { stepCmp } from "../step.js";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit.js";
import { Chart3 } from "../legacy/chart3.js";
import { BPMChange1 } from "../legacy/chart1.js";

function accelLuaCommand(bpm: number) {
  return `Accel(${bpm})`;
}
export function luaAddSpeedChange<L extends LevelEdit | Chart3>(
  chart: L,
  change: BPMChange | BPMChange1
): L | null {
  const insert = findInsertLine(chart, change.step, true);
  if (insert.luaLine === null) {
    return null;
  }
  chart = insert.chart;

  insertLua(chart, insert.luaLine, accelLuaCommand(change.bpm));
  chart.speedChanges.push({ ...change, luaLine: insert.luaLine });
  chart.speedChanges = chart.speedChanges.sort((a, b) =>
    stepCmp(a.step, b.step)
  );
  return chart;
}
export function luaUpdateSpeedChange(
  chart: LevelEdit,
  index: number,
  bpm: number
) {
  if (chart.speedChanges[index].luaLine === null) {
    return null;
  }
  replaceLua(chart, chart.speedChanges[index].luaLine, accelLuaCommand(bpm));
  chart.speedChanges[index].bpm = bpm;
  // updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return chart;
}
export function luaDeleteSpeedChange(chart: LevelEdit, index: number) {
  if (chart.speedChanges[index].luaLine === null) {
    return null;
  }
  deleteLua(chart, chart.speedChanges[index].luaLine);
  chart.speedChanges = chart.speedChanges.filter((_ch, i) => i !== index);
  // updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return chart;
}
