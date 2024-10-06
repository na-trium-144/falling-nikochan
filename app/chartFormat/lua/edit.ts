import { Chart } from "../chart";
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
  for (const n of chart.speedChanges) {
    if (n.luaLine === line) {
      return n.step;
    }
  }
  return null;
}

// コマンドを挿入
export function insertLua(chart: Chart, line: number, content: string) {
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
  chart.speedChanges.forEach((n) => {
    if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine++;
    }
  });
}
// コマンドを置き換え
export function replaceLua(chart: Chart, line: number, content: string) {
  chart.lua = chart.lua
    .slice(0, line)
    .concat([content])
    .concat(chart.lua.slice(line + 1));
}
// コマンドを削除
export function deleteLua(chart: Chart, line: number) {
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
  chart.speedChanges.forEach((n) => {
    if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine--;
    }
  });
}

function stepLuaCommand(s: Step) {
  return `Step(${s.fourth * s.denominator + s.numerator}, ${
    s.denominator * 4
  })`;
}
// 時刻stepにコマンドを挿入する準備
// 挿入する行、またはnullを返す。
// 既存のStepコマンドを分割する必要がある場合は分割し、
// Stepコマンドを追加する必要がある場合は追加する。
export function findInsertLine(chart: Chart, step: Step) {
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
  let stepBefore: Step;
  if (lastRest) {
    stepBefore = stepSub(step, stepAdd(lastRest.begin, lastRest.duration));
  } else {
    stepBefore = stepZero();
  }
  const newLine = chart.lua.length;
  if (stepCmp(stepBefore, step) === 0) {
    return newLine;
  } else {
    insertLua(chart, newLine, stepLuaCommand(stepBefore));
    return newLine + 1;
  }
}
