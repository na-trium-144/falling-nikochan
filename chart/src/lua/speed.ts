import { BPMChange, SpeedChange } from "../bpm.js";
import { stepCmp } from "../step.js";
import {
  deleteLua,
  findInsertLine,
  insertLua,
  LevelForLuaEdit,
  replaceLua,
} from "./edit.js";
import { BPMChange1 } from "../legacy/chart1.js";

function accelLuaCommand(bpm: number, interp: boolean) {
  if (interp) {
    return `AccelEnd(${bpm})`;
  } else {
    return `Accel(${bpm})`;
  }
}
export function luaAddSpeedChange<L extends LevelForLuaEdit>(
  chart: L,
  change: SpeedChange | BPMChange | BPMChange1
): L | null {
  const insert = findInsertLine(chart, change.step, true);
  if (insert.luaLine === null) {
    return null;
  }
  chart = insert.chart;

  insertLua(
    chart,
    insert.luaLine,
    accelLuaCommand(change.bpm, "interp" in change && change.interp)
  );
  (chart.speedChanges as Array<(typeof chart.speedChanges)[number]>).push({
    ...change,
    luaLine: insert.luaLine,
  });
  chart.speedChanges = chart.speedChanges.sort((a, b) =>
    stepCmp(a.step, b.step)
  );
  return chart;
}
export function luaUpdateSpeedChange<L extends LevelForLuaEdit>(
  chart: L,
  index: number,
  bpm: number,
  interp: boolean
) {
  if (chart.speedChanges[index].luaLine === null) {
    return null;
  }
  replaceLua(
    chart,
    chart.speedChanges[index].luaLine,
    accelLuaCommand(bpm, interp)
  );
  chart.speedChanges[index].bpm = bpm;
  // updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return chart;
}
export function luaDeleteSpeedChange<L extends LevelForLuaEdit>(
  chart: L,
  index: number
) {
  if (chart.speedChanges[index].luaLine === null) {
    return null;
  }
  deleteLua(chart, chart.speedChanges[index].luaLine);
  chart.speedChanges = chart.speedChanges.filter((_ch, i) => i !== index);
  // updateBpmTimeSec(chart.bpmChanges, chart.speedChanges);
  return chart;
}
