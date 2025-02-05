import { Level } from "../chart.js";
import { Level5 } from "../legacy/chart5.js";
import {
  Step,
  stepAdd,
  stepCmp,
  stepSimplify,
  stepSub,
  stepZero,
} from "../step.js";

export function findStepFromLua(chart: Level, line: number): Step | null {
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
export function insertLua<L extends Level | Level5>(chart: L, line: number, content: string) {
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
export function replaceLua<L extends Level | Level5>(chart: L, line: number, content: string) {
  chart.lua = chart.lua
    .slice(0, line)
    .concat([content])
    .concat(chart.lua.slice(line + 1));
}
// コマンドを削除
export function deleteLua(chart: Level, line: number) {
  chart.lua = chart.lua.slice(0, line).concat(chart.lua.slice(line + 1));
  // 以降の行番号がすべて1ずれる
  // 削除した行のコマンドに対応するデータはとりあえずnull
  chart.notes.forEach((n) => {
    if (n.luaLine === line) {
      n.luaLine = null;
    } else if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine--;
    }
  });
  chart.rest.forEach((n) => {
    if (n.luaLine === line) {
      n.luaLine = null;
    } else if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine--;
    }
  });
  chart.bpmChanges.forEach((n) => {
    if (n.luaLine === line) {
      n.luaLine = null;
    } else if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine--;
    }
  });
  chart.speedChanges.forEach((n) => {
    if (n.luaLine === line) {
      n.luaLine = null;
    } else if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine--;
    }
  });
}

function stepLuaCommand(s: Step) {
  let num = s.fourth * s.denominator + s.numerator;
  let denom = s.denominator * 4;
  for (let i = 2; i <= num && i <= denom; i++) {
    while (num % i == 0 && denom % i == 0 && denom / i >= 4) {
      num /= i;
      denom /= i;
    }
  }
  return `Step(${num}, ${denom})`;
}
// 時刻stepにコマンドを挿入する準備
// 挿入する行、またはnullを返す。
// 既存のStepコマンドを分割する必要がある場合は分割し、
// Stepコマンドを追加する必要がある場合は追加する。
export function findInsertLine<L extends Level | Level5>(
  chart: L,
  step: Step
): { chart: L; luaLine: number | null } {
  for (let ri = 0; ri < chart.rest.length; ri++) {
    const rest = chart.rest[ri];
    if (stepCmp(rest.begin, step) === 0) {
      return { chart, luaLine: rest.luaLine };
    } else {
      const restEnd = stepAdd(rest.begin, rest.duration);
      if (stepCmp(restEnd, step) > 0) {
        if (rest.luaLine === null) {
          return { chart, luaLine: null };
        }
        const stepBefore = stepSub(step, rest.begin);
        const stepAfter = stepSub(restEnd, step);
        replaceLua(chart, rest.luaLine, stepLuaCommand(stepBefore));
        insertLua(chart, rest.luaLine + 1, stepLuaCommand(stepAfter));
        chart.rest = chart.rest
          .slice(0, ri)
          .concat([
            { begin: rest.begin, duration: stepBefore, luaLine: rest.luaLine },
            { begin: step, duration: stepAfter, luaLine: rest.luaLine + 1 },
          ])
          .concat(chart.rest.slice(ri + 1));
        return { chart, luaLine: rest.luaLine + 1 };
      }
    }
  }
  const lastRest = chart.rest[chart.rest.length - 1];
  let restBegin: Step;
  let stepBefore: Step;
  if (lastRest) {
    restBegin = stepAdd(lastRest.begin, lastRest.duration);
    stepBefore = stepSub(step, restBegin);
  } else {
    restBegin = stepZero();
    stepBefore = stepSimplify(step);
  }
  const newLine = chart.lua.length;
  if (stepCmp(stepBefore, stepZero()) === 0) {
    return { chart, luaLine: newLine };
  } else {
    insertLua(chart, newLine, stepLuaCommand(stepBefore));
    chart.rest.push({
      begin: restBegin,
      duration: stepBefore,
      luaLine: newLine,
    });
    return { chart, luaLine: newLine + 1 };
  }
}
