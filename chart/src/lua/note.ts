import { LevelEdit } from "../chart.js";
import { NoteCommand, NoteCommandWithLua } from "../command.js";
import { Chart3, NoteCommand3 } from "../legacy/chart3.js";
import { NoteCommand7 } from "../legacy/chart7.js";
import { Step, stepCmp } from "../step.js";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit.js";

function noteLuaCommand(n: NoteCommand | NoteCommand3 | NoteCommand7) {
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
  N extends NoteCommand | NoteCommand3 | NoteCommand7
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
export function luaDeleteNote(
  chart: LevelEdit,
  currentNoteIndex: number
): LevelEdit | null {
  const n = chart.notes[currentNoteIndex];
  if (n.luaLine === null) {
    return null;
  }
  deleteLua(chart, n.luaLine);
  chart.notes = chart.notes.filter((_, i) => i !== currentNoteIndex);
  return chart;
}
export function luaUpdateNote(
  chart: LevelEdit,
  currentNoteIndex: number,
  n: NoteCommand | NoteCommand7
): LevelEdit | null {
  const oldN = chart.notes[currentNoteIndex];
  if (oldN.luaLine === null) {
    return null;
  }
  const newNote = { ...n, step: oldN.step, luaLine: oldN.luaLine };
  replaceLua(chart, oldN.luaLine, noteLuaCommand(newNote));
  chart.notes[currentNoteIndex] = newNote;
  return chart;
}
