import { Chart } from "../chart";
import { BPMChange, updateBpmTimeSec } from "../command";
import { stepCmp } from "../step";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit";

function accelLuaCommand(bpm: number) {
  return `Accel(${bpm})`;
}
export function luaAddSpeedChange(chart: Chart, change: BPMChange) {
  const insert = findInsertLine(chart, change.step);
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
export function luaUpdateSpeedChange(chart: Chart, index: number, bpm: number) {
  if (chart.speedChanges[index].luaLine === null) {
    return null;
  }
  replaceLua(chart, chart.speedChanges[index].luaLine, accelLuaCommand(bpm));
  chart.speedChanges[index].bpm = bpm;
  // updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return chart;
}
export function luaDeleteSpeedChange(chart: Chart, index: number) {
  if (chart.speedChanges[index].luaLine === null) {
    return null;
  }
  deleteLua(chart, chart.speedChanges[index].luaLine);
  chart.speedChanges = chart.speedChanges.filter((_ch, i) => i !== index);
  // updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return chart;
}
