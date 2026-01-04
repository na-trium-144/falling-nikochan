import { NoteCommand, NoteCommandWithLua } from "../command.js";
import { NoteCommand3 } from "../legacy/chart3.js";
import { Step, stepCmp } from "../step.js";
import {
  deleteLua,
  findInsertLine,
  insertLua,
  LevelForLuaEdit,
  replaceLua,
} from "./edit.js";

function noteLuaCommand(n: NoteCommand | NoteCommand3) {
  if ("fall" in n) {
    return (
      `Note(${n.hitX}, ${n.hitVX}, ${n.hitVY}, ` +
      `${n.big ? "true" : "false"}, ${n.fall ? "true" : "false"})`
    );
  } else {
    return (
      `Note(${n.hitX}, ${n.hitVX}, ${n.hitVY}, ` +
      `${n.big ? "true" : "false"})`
    );
  }
}
export function luaAddNote<
  L extends LevelForLuaEdit,
  N extends NoteCommand | NoteCommand3,
>(chart: L, n: N, step: Step): L | null {
  const insert = findInsertLine(chart, step, true);
  if (insert.luaLine === null) {
    return null;
  }
  chart = insert.chart;

  const newNote = { ...n, step, luaLine: insert.luaLine };
  insertLua(chart, insert.luaLine, noteLuaCommand(n));

  chart.notes.push(newNote as NoteCommandWithLua);
  chart.notes = chart.notes.sort((a, b) => stepCmp(a.step, b.step));
  return chart;
}
export function luaDeleteNote<L extends LevelForLuaEdit>(
  chart: L,
  currentNoteIndex: number
): L | null {
  const n = chart.notes[currentNoteIndex];
  if (n.luaLine === null) {
    return null;
  }
  deleteLua(chart, n.luaLine);
  chart.notes = chart.notes.filter((_, i) => i !== currentNoteIndex);
  return chart;
}
export function luaUpdateNote<L extends LevelForLuaEdit>(
  chart: L,
  currentNoteIndex: number,
  n: NoteCommand
): L | null {
  const oldN = chart.notes[currentNoteIndex];
  if (oldN.luaLine === null) {
    return null;
  }
  const newNote = { ...n, step: oldN.step, luaLine: oldN.luaLine };
  replaceLua(chart, oldN.luaLine, noteLuaCommand(newNote));
  chart.notes[currentNoteIndex] = newNote;
  return chart;
}
