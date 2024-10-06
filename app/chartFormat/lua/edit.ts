import { Chart } from "../chart";
import { NoteCommand, NoteCommandWithLua } from "../command";
import { Step, stepAdd, stepCmp, stepSub, stepZero } from "../step";

// コマンドを挿入
function insertLua(chart: Chart, line: number, content: string) {
  chart.lua = chart.lua
    .slice(0, line)
    .concat([content])
    .concat(chart.lua.slice(line));
  chart.notes.forEach((n) => {
    if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine++;
    }
  });
  chart.rest.forEach((n) => {
    if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine++;
    }
  });
}
// コマンドを置き換え
function replaceLua(chart: Chart, line: number, content: string) {
  chart.lua = chart.lua
    .slice(0, line)
    .concat([content])
    .concat(chart.lua.slice(line + 1));
}
// コマンドを削除
function deleteLua(chart: Chart, line: number) {
  chart.lua = chart.lua.slice(0, line).concat(chart.lua.slice(line + 1));
}

function noteLuaCommand(n: NoteCommand) {
  return `Note(${n.hitX}, ${n.hitVX}, ${n.hitVY}, ${n.accelY}, ${
    n.big ? "true" : "false"
  })`;
}
function stepLuaCommand(s: Step) {
  return `Step(${s.fourth * s.denominator + s.numerator}, ${
    s.denominator * 4
  })`;
}
export function luaAddNote(
  chart: Chart,
  n: NoteCommand,
  step: Step
): Chart | null {
  console.log("old chart = ", chart);
  let newNote: NoteCommandWithLua | null = null;
  for (let ri = 0; ri < chart.rest.length; ri++) {
    const rest = chart.rest[ri];
    const restEnd = stepAdd(rest.begin, rest.duration);
    if (stepCmp(rest.begin, step) === 0) {
      if (rest.luaLine === null) {
        return null;
      }
      newNote = { ...n, step, luaLine: rest.luaLine };
      insertLua(chart, rest.luaLine, noteLuaCommand(n));
      break;
    } else if (stepCmp(restEnd, step) > 0) {
      if (rest.luaLine === null) {
        return null;
      }
      const stepBefore = stepSub(step, rest.begin);
      const stepAfter = stepSub(restEnd, step);
      replaceLua(chart, rest.luaLine, stepLuaCommand(stepBefore));
      newNote = { ...n, step, luaLine: rest.luaLine + 1 };
      insertLua(chart, rest.luaLine + 1, noteLuaCommand(newNote));
      insertLua(chart, rest.luaLine + 2, stepLuaCommand(stepAfter));
      break;
    }
  }
  if (newNote === null) {
    const lastRest = chart.rest[chart.rest.length - 1];
    const stepBefore = stepSub(
      step,
      stepAdd(lastRest.begin, lastRest.duration)
    );
    const newLine = chart.lua.length;
    if (stepCmp(stepBefore, step) === 0) {
      newNote = { ...n, step, luaLine: newLine };
      insertLua(chart, newLine, noteLuaCommand(newNote));
    } else {
      insertLua(chart, newLine, stepLuaCommand(stepBefore));
      newNote = { ...n, step, luaLine: newLine + 1 };
      insertLua(chart, newLine + 1, noteLuaCommand(newNote));
    }
  }

  chart.notes.push(newNote);
  chart.notes = chart.notes.sort((a, b) => stepCmp(a.step, b.step));
  console.log("new chart = ", chart);
  return chart;
}
export function luaDeleteNote(
  chart: Chart,
  currentNoteIndex: number
): Chart | null {
  console.log("old chart = ", chart);
  const n = chart.notes[currentNoteIndex];
  if (n.luaLine === null) {
    return null;
  }
  deleteLua(chart, n.luaLine);
  chart.notes = chart.notes.filter((_, i) => i !== currentNoteIndex);
  console.log("new chart = ", chart);
  return chart;
}
export function luaUpdateNote(
  chart: Chart,
  currentNoteIndex: number,
  n: NoteCommand
): Chart | null {
  console.log("old chart = ", chart);
  const oldN = chart.notes[currentNoteIndex];
  if (oldN.luaLine === null) {
    return null;
  }
  const newNote = { ...n, step: oldN.step, luaLine: oldN.luaLine };
  replaceLua(chart, oldN.luaLine, noteLuaCommand(newNote));
  chart.notes[currentNoteIndex] = newNote;
  console.log("new chart = ", chart);
  return chart;
}
