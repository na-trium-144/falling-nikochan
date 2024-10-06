import { Chart } from "../chart";
import {
  BPMChange,
  NoteCommand,
  NoteCommandWithLua,
  updateBpmTimeSec,
} from "../command";
import { Step, stepAdd, stepCmp, stepSub, stepZero } from "../step";

export function findStepFromLua(chart: Chart, line: number): Step | null {
  for (const n of chart.notes) {
    if (n.luaLine === line) {
      return n.step;
    }
  }
  for (const n of chart.rest) {
    if (n.luaLine === line) {
      return n.begin;
    }
  }
  for (const n of chart.bpmChanges) {
    if (n.luaLine === line) {
      return n.step;
    }
  }
  return null;
}

// コマンドを挿入
function insertLua(chart: Chart, line: number, content: string) {
  chart.lua = chart.lua
    .slice(0, line)
    .concat([content])
    .concat(chart.lua.slice(line));
  // 以降の行番号がすべて1ずれる
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
  chart.bpmChanges.forEach((n) => {
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
  // 以降の行番号がすべて1ずれる
  chart.notes.forEach((n) => {
    if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine--;
    }
  });
  chart.rest.forEach((n) => {
    if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine--;
    }
  });
  chart.bpmChanges.forEach((n) => {
    if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine--;
    }
  });
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
function bpmLuaCommand(bpm: number) {
  return `BPM(${bpm})`;
}

// 時刻stepにコマンドを挿入する準備
// 挿入する行、またはnullを返す。
// 既存のStepコマンドを分割する必要がある場合は分割し、
// Stepコマンドを追加する必要がある場合は追加する。
function findInsertLine(chart: Chart, step: Step) {
  for (let ri = 0; ri < chart.rest.length; ri++) {
    const rest = chart.rest[ri];
    if (stepCmp(rest.begin, step) === 0) {
      return rest.luaLine;
    } else {
      const restEnd = stepAdd(rest.begin, rest.duration);
      if (stepCmp(restEnd, step) > 0) {
        if (rest.luaLine === null) {
          return null;
        }
        const stepBefore = stepSub(step, rest.begin);
        const stepAfter = stepSub(restEnd, step);
        replaceLua(chart, rest.luaLine, stepLuaCommand(stepBefore));
        insertLua(chart, rest.luaLine + 1, stepLuaCommand(stepAfter));
        return rest.luaLine + 1;
      }
    }
  }
  const lastRest = chart.rest[chart.rest.length - 1];
  const stepBefore = stepSub(step, stepAdd(lastRest.begin, lastRest.duration));
  const newLine = chart.lua.length;
  if (stepCmp(stepBefore, step) === 0) {
    return newLine;
  } else {
    insertLua(chart, newLine, stepLuaCommand(stepBefore));
    return newLine + 1;
  }
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

export function luaAddBpmChange(chart: Chart, change: BPMChange) {
  const luaLine = findInsertLine(chart, change.step);
  if (luaLine === null) {
    return null;
  }
  insertLua(chart, luaLine, bpmLuaCommand(change.bpm));
  chart.bpmChanges.push({ ...change, luaLine });
  chart.bpmChanges = chart.bpmChanges.sort((a, b) => stepCmp(a.step, b.step));
  return chart;
}
export function luaUpdateBpmChange(chart: Chart, index: number, bpm: number) {
  if (chart.bpmChanges[index].luaLine === null) {
    return null;
  }
  replaceLua(chart, chart.bpmChanges[index].luaLine, bpmLuaCommand(bpm));
  chart.bpmChanges[index].bpm = bpm;
  updateBpmTimeSec(chart.bpmChanges, chart.scaleChanges);
  return chart;
}
export function luaDeleteBpmChange(chart: Chart, index: number) {
  if (chart.bpmChanges[index].luaLine === null) {
    return null;
  }
  deleteLua(chart, chart.bpmChanges[index].luaLine);
  chart.bpmChanges = chart.bpmChanges.filter((_ch, i) => i !== index);
  updateBpmTimeSec(chart.bpmChanges, chart.scaleChanges);
  return chart;
}
