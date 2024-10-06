import { Chart } from "../chart";
import { NoteCommand } from "../command";
import { Step, stepCmp } from "../step";
import { deleteLua, findInsertLine, insertLua, replaceLua } from "./edit";

function noteLuaCommand(n: NoteCommand) {
  return `Note(${n.hitX}, ${n.hitVX}, ${n.hitVY}, ${n.accelY}, ${
    n.big ? "true" : "false"
  })`;
}
export function luaAddNote(
  chart: Chart,
  n: NoteCommand,
  step: Step
): Chart | null {
  const luaLine = findInsertLine(chart, step);
  if (luaLine === null) {
    return null;
  }

  const newNote = { ...n, step, luaLine };
  insertLua(chart, luaLine, noteLuaCommand(n));

  chart.notes.push(newNote);
  chart.notes = chart.notes.sort((a, b) => stepCmp(a.step, b.step));
  return chart;
}
export function luaDeleteNote(
  chart: Chart,
  currentNoteIndex: number
): Chart | null {
  const n = chart.notes[currentNoteIndex];
  if (n.luaLine === null) {
    return null;
  }
  deleteLua(chart, n.luaLine);
  chart.notes = chart.notes.filter((_, i) => i !== currentNoteIndex);
  return chart;
}
export function luaUpdateNote(
  chart: Chart,
  currentNoteIndex: number,
  n: NoteCommand
): Chart | null {
  const oldN = chart.notes[currentNoteIndex];
  if (oldN.luaLine === null) {
    return null;
  }
  const newNote = { ...n, step: oldN.step, luaLine: oldN.luaLine };
  replaceLua(chart, oldN.luaLine, noteLuaCommand(newNote));
  chart.notes[currentNoteIndex] = newNote;
  return chart;
}
