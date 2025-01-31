import { Level } from "../chart";
import { NoteCommand } from "../command";
import { Step, stepCmp } from "../step";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit";

function noteLuaCommand(n: NoteCommand) {
  return `Note(${n.hitX}, ${n.hitVX}, ${n.hitVY}, ${n.big ? "true" : "false"})`;
}
export function luaAddNote(
  chart: Level,
  n: NoteCommand,
  step: Step
): Level | null {
  const insert = findInsertLine(chart, step);
  if (insert.luaLine === null) {
    return null;
  }
  chart = insert.chart;

  const newNote = { ...n, step, luaLine: insert.luaLine };
  insertLua(chart, insert.luaLine, noteLuaCommand(n));

  chart.notes.push(newNote);
  chart.notes = chart.notes.sort((a, b) => stepCmp(a.step, b.step));
  return chart;
}
export function luaDeleteNote(
  chart: Level,
  currentNoteIndex: number
): Level | null {
  const n = chart.notes[currentNoteIndex];
  if (n.luaLine === null) {
    return null;
  }
  deleteLua(chart, n.luaLine);
  chart.notes = chart.notes.filter((_, i) => i !== currentNoteIndex);
  return chart;
}
export function luaUpdateNote(
  chart: Level,
  currentNoteIndex: number,
  n: NoteCommand
): Level | null {
  const oldN = chart.notes[currentNoteIndex];
  if (oldN.luaLine === null) {
    return null;
  }
  const newNote = { ...n, step: oldN.step, luaLine: oldN.luaLine };
  replaceLua(chart, oldN.luaLine, noteLuaCommand(newNote));
  chart.notes[currentNoteIndex] = newNote;
  return chart;
}
