import { LevelEdit } from "../chart.js";
import { NoteCommand, NoteCommandWithLua } from "../command.js";
import { Chart3, NoteCommand3 } from "../legacy/chart3.js";
import { Step, stepCmp } from "../step.js";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit.js";

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
  L extends LevelEdit | Chart3,
  N extends NoteCommand | NoteCommand3
>(
  chart: L,
  lua: string[],
  n: N,
  step: Step
): { chart: L; lua: string[] } | null {
  const insert = findInsertLine(chart, lua, step);
  if (insert.luaLine === null) {
    return null;
  }
  chart = insert.chart;
  lua = insert.lua;

  const newNote = { ...n, step, luaLine: insert.luaLine };
  lua = insertLua(chart, lua, insert.luaLine, noteLuaCommand(n));

  chart.notes.push(newNote as NoteCommandWithLua);
  chart.notes = chart.notes.sort((a, b) => stepCmp(a.step, b.step));
  return { chart, lua };
}
export function luaDeleteNote(
  chart: LevelEdit,
  lua: string[],
  currentNoteIndex: number
): { chart: LevelEdit; lua: string[] } | null {
  const n = chart.notes[currentNoteIndex];
  if (n.luaLine === null) {
    return null;
  }
  lua = deleteLua(chart, lua, n.luaLine);
  chart.notes = chart.notes.filter((_, i) => i !== currentNoteIndex);
  return { chart, lua };
}
export function luaUpdateNote(
  chart: LevelEdit,
  lua: string[],
  currentNoteIndex: number,
  n: NoteCommand
): { chart: LevelEdit; lua: string[] } | null {
  const oldN = chart.notes[currentNoteIndex];
  if (oldN.luaLine === null) {
    return null;
  }
  const newNote = { ...n, step: oldN.step, luaLine: oldN.luaLine };
  lua = replaceLua(chart, lua, oldN.luaLine, noteLuaCommand(newNote));
  chart.notes[currentNoteIndex] = newNote;
  return { chart, lua };
}
