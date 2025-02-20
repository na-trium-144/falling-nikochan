import { LevelEdit } from "../chart.js";
import { Chart3 } from "../legacy/chart3.js";
import { Level5 } from "../legacy/chart5.js";
import {
  Step,
  stepAdd,
  stepCmp,
  stepSimplify,
  stepSub,
  stepZero,
} from "../step.js";

export function findStepFromLua(chart: LevelEdit, line: number): Step | null {
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
  for (const n of chart.signature) {
    if (n.luaLine === line) {
      return n.step;
    }
  }
  return null;
}

// コマンドを挿入
export function insertLua<L extends LevelEdit | Level5 | Chart3>(
  chart: L,
  lua: string[],
  line: number,
  content: string
): string[] {
  lua = lua
    .slice(0, line)
    .concat([content])
    .concat(lua.slice(line));
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
  if ("signature" in chart) {
    chart.signature.forEach((n) => {
      if (n.luaLine !== null && n.luaLine >= line) {
        n.luaLine++;
      }
    });
  }
  return lua;
}
// コマンドを置き換え
export function replaceLua<L extends LevelEdit | Level5 | Chart3>(
  chart: L,
  lua: string[],
  line: number,
  content: string
) : string[]{
  return lua
    .slice(0, line)
    .concat([content])
    .concat(lua.slice(line + 1));
}
// コマンドを削除
export function deleteLua(chart: LevelEdit, lua: string[], line: number): string[] {
  lua = lua.slice(0, line).concat(lua.slice(line + 1));
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
  chart.signature.forEach((n) => {
    if (n.luaLine === line) {
      n.luaLine = null;
    } else if (n.luaLine !== null && n.luaLine >= line) {
      n.luaLine--;
    }
  });
  return lua;
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
export function findInsertLine<L extends LevelEdit | Level5 | Chart3>(
  chart: L,
  lua: string[],
  step: Step
): { chart: L; lua: string[], luaLine: number | null } {
  for (let ri = 0; ri < chart.rest.length; ri++) {
    const rest = chart.rest[ri];
    if (stepCmp(rest.begin, step) === 0) {
      return { chart, lua, luaLine: rest.luaLine };
    } else {
      const restEnd = stepAdd(rest.begin, rest.duration);
      if (stepCmp(restEnd, step) > 0) {
        if (rest.luaLine === null) {
          return { chart, lua, luaLine: null };
        }
        const stepBefore = stepSub(step, rest.begin);
        const stepAfter = stepSub(restEnd, step);
        lua = replaceLua(chart, lua, rest.luaLine, stepLuaCommand(stepBefore));
        lua = insertLua(chart, lua, rest.luaLine + 1, stepLuaCommand(stepAfter));
        chart.rest = chart.rest
          .slice(0, ri)
          .concat([
            { begin: rest.begin, duration: stepBefore, luaLine: rest.luaLine },
            { begin: step, duration: stepAfter, luaLine: rest.luaLine + 1 },
          ])
          .concat(chart.rest.slice(ri + 1));
        return { chart, lua, luaLine: rest.luaLine + 1 };
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
  const newLine = lua.length;
  if (stepCmp(stepBefore, stepZero()) === 0) {
    return { chart, lua, luaLine: newLine };
  } else {
    insertLua(chart, lua, newLine, stepLuaCommand(stepBefore));
    chart.rest.push({
      begin: restBegin,
      duration: stepBefore,
      luaLine: newLine,
    });
    return { chart, lua, luaLine: newLine + 1 };
  }
}
