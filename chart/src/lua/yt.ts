import { LevelEdit } from "../chart.js";
import { Level11Edit, YTBegin11, YTEnd11 } from "../legacy/chart11.js";
import { Level9Edit } from "../legacy/chart9.js";
import { insertLua, replaceLua } from "./edit.js";

function ytBeginLuaCommand(sec: number) {
  return `VideoBeginAt(${sec})`;
}
function ytEndLuaCommand(sec: number | "note" | "yt") {
  switch (sec) {
    case "note":
      return "VideoEndAuto()";
    case "yt":
      return "VideoEndFull()";
    default:
      return `VideoEndAt(${sec})`;
  }
}
export function luaInsertYTBeginEnd(chart: Level9Edit): Level11Edit {
  insertLua(chart, 0, ytBeginLuaCommand(0));
  insertLua(chart, 1, ytEndLuaCommand("note"));
  return {
    ...chart,
    ytBegin: { timeSec: 0, luaLine: 0 },
    ytEnd: { timeSec: "note", luaLine: 1 },
  };
}
export function luaReplaceYTBegin(chart: LevelEdit, change: YTBegin11) {
  if (chart.ytBegin.luaLine === null) {
    return;
  }
  replaceLua(chart, chart.ytBegin.luaLine, ytBeginLuaCommand(change.timeSec));
  chart.ytBegin.timeSec = change.timeSec;
  return chart;
}
export function luaReplaceYTEnd(chart: LevelEdit, change: YTEnd11) {
  if (chart.ytEnd.luaLine === null) {
    return;
  }
  replaceLua(chart, chart.ytEnd.luaLine, ytEndLuaCommand(change.timeSec));
  chart.ytEnd.timeSec = change.timeSec;
  return chart;
}
