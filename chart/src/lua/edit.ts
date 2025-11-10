import { BPMChange, BPMChangeWithLua, SpeedChange, SpeedChangeWithLua } from "../bpm.js";
import { LevelEdit, LevelFreeze } from "../chart.js";
import { NoteCommand, RestStep } from "../command.js";
import { Level11Edit } from "../legacy/chart11.js";
import { SpeedChangeWithLua13 } from "../legacy/chart13.js";
import {
  BPMChangeWithLua3,
  Chart3,
  NoteCommandWithLua3,
  RestStep3,
} from "../legacy/chart3.js";
import { Level5, SignatureWithLua5 } from "../legacy/chart5.js";
import { BPMChange9, Level9Edit, NoteCommand9, Rest9, Signature9 } from "../legacy/chart9.js";
import { Signature, SignatureWithLua } from "../signature.js";
import {
  Step,
  stepAdd,
  stepCmp,
  stepSimplify,
  stepSub,
  stepZero,
} from "../step.js";

/**
 * chart/src/lua/ 以下の関数はいずれも引数に渡されたレベルオブジェクトを直接書き換える場合がある。
 * とても良くないんだけど、これを仕様変更してすべてを動作確認するのはめんどいので放置している (TODO?)
 *
 * 書き換えられたくないレベルデータは呼び出し元でディープコピーしよう
 */
export interface LevelForLuaEditLatest {
  notes: NoteCommand[];
  rest: RestStep[];
  bpmChanges: BPMChangeWithLua[];
  speedChanges: SpeedChangeWithLua[];
  signature: SignatureWithLua[];
  lua: string[];
}
export interface LevelForLuaEdit {
  notes: NoteCommand9[] | NoteCommandWithLua3[];
  rest: Rest9[] | RestStep3[];
  bpmChanges: BPMChange9[] | BPMChangeWithLua3[];
  speedChanges: SpeedChangeWithLua13[] | BPMChange9[] | BPMChangeWithLua3[];
  signature?: Signature9[] | SignatureWithLua5[];
  lua: string[];
}

export function findStepFromLua(
  chart: LevelForLuaEdit,
  line: number
): Step | null {
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
  if (chart.signature) {
    for (const n of chart.signature) {
      if (n.luaLine === line) {
        return n.step;
      }
    }
  }
  return null;
}

/**
 * コマンドを挿入
 */
export function insertLua(
  chart: LevelForLuaEdit,
  line: number,
  content: string
) {
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
  if (chart.signature) {
    chart.signature.forEach((n) => {
      if (n.luaLine !== null && n.luaLine >= line) {
        n.luaLine++;
      }
    });
  }
}
/**
 * コマンドを置き換え
 */
export function replaceLua(
  chart: LevelForLuaEdit,
  line: number,
  content: string
) {
  chart.lua = chart.lua
    .slice(0, line)
    .concat([content])
    .concat(chart.lua.slice(line + 1));
}
/**
 * コマンドを削除
 *
 * 以降の行番号がすべて1ずれる
 * 削除した行のコマンドに対応するデータはとりあえずnull
 */
export function deleteLua(chart: LevelForLuaEdit, line: number) {
  chart.lua = chart.lua.slice(0, line).concat(chart.lua.slice(line + 1));
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
  chart.signature?.forEach((n) => {
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
/**
 * 時刻stepにコマンドを挿入する準備
 *
 * 挿入する行、またはnullを返す。
 * modify=trueの場合、既存のStepコマンドを分割する必要がある場合は分割し、
 * Stepコマンドを追加する必要がある場合は追加する。
 */
export function findInsertLine<L extends LevelForLuaEdit>(
  chart: L,
  step: Step,
  modify: boolean
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
        if (!modify) {
          return { chart, luaLine: rest.luaLine };
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
    if (!modify) {
      return { chart, luaLine: newLine + 1 };
    }
    insertLua(chart, newLine, stepLuaCommand(stepBefore));
    chart.rest.push({
      begin: restBegin,
      duration: stepBefore,
      luaLine: newLine,
    });
    return { chart, luaLine: newLine + 1 };
  }
}
