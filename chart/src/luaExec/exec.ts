import { LuaFactory } from "wasmoon";
import { Step, StepSchema, stepZero } from "../step.js";
import { LevelFreeze } from "../chart.js";
import { LevelFreezeSchema13 } from "../legacy/chart13.js";
import * as v from "valibot";

export interface LuaExecResult {
  stdout: string[];
  err: string[];
  errorLine: number | null;
  levelFreezed: LevelFreeze;
  rawReturnValue: unknown;
  step: Step;
}
export async function luaExec(
  wasmPath: string,
  fnCommandsLib: string,
  code: string,
  options: {
    catchError?: boolean;
    needReturnValue?: boolean;
  }
): Promise<LuaExecResult> {
  const factory = new LuaFactory(wasmPath);
  await factory.mountFile(
    "/usr/local/share/lua/5.4/fn-commands.lua",
    fnCommandsLib
  );
  const lua = await factory.createEngine();
  const result: LuaExecResult = {
    stdout: [],
    err: [],
    errorLine: null,
    levelFreezed: {
      notes: [],
      rest: [],
      bpmChanges: [],
      speedChanges: [],
      signature: [],
    },
    rawReturnValue: undefined,
    step: stepZero(),
  };
  try {
    lua.global.set("print", (...args: unknown[]) => {
      result.stdout.push(args.map((a) => String(a)).join("\t"));
    });

    /*
      実行前に Note(...) → NoteStatic(行番号, ...) に置き換え、
      引数に渡された行番号をNoteCommandといっしょに保存
      保存した行番号は、その音符を(Noteタブなどから)編集したときに
      luaの該当の部分を修正するために使う。
      Note()の引数に変数が入っていたりする場合は置き換えない (行番号はnullにする)
      この場合Noteタブなどから編集できない
    */

    const codeStatic = code.split("\n").map((lineStr, ln) =>
      lineStr
        .replace(
          /^( *)Note\(( *-?[\d.]+ *(?:, *-?[\d.]+ *){2}(?:, *(?:true|false) *){1,2})\)( *)$/,
          `$1NoteStatic(${ln},$2)$3`
        )
        .replace(
          /^( *)Step\(( *[\d.]+ *, *[\d.]+ *)\)( *)$/,
          `$1StepStatic(${ln},$2)$3`
        )
        .replace(
          /^( *)Beat\(( *{[-\d.,{} ]+} *(?:, *[\d.]+ *){0,2})\)( *)$/,
          `$1BeatStatic(${ln},$2)$3`
        )
        .replace(/^( *)BPM\(( *[\d.]+ *)\)( *)$/, `$1BPMStatic(${ln},$2)$3`)
        .replace(
          /^( *)Accel\(( *-?[\d.]+ *)\)( *)$/,
          `$1AccelStatic(${ln},$2)$3`
        )
        .replace(
          /^( *)AccelBegin\(( *-?[\d.]+ *)\)( *)$/,
          `$1AccelBeginStatic(${ln},$2)$3`
        )
        .replace(
          /^( *)AccelEnd\(( *-?[\d.]+ *)\)( *)$/,
          `$1AccelEndStatic(${ln},$2)$3`
        )
    );
    // console.log(codeStatic);
    await lua.doString('require("fn-commands")');
    const value = await lua.doString(codeStatic.join("\n"));
    if (options.needReturnValue) {
      result.rawReturnValue = value;
    }

    const fnState = await lua.doString("return _G.fnState");
    console.log(fnState);
    function parseArrayOrEmpty(a: unknown): unknown[] {
      if (Array.isArray(a)) {
        return a;
      } else if (typeof a === "object" && a && Object.keys(a).length === 0) {
        return [];
      } else {
        throw new Error(`unexpected object: ${JSON.stringify(a)}`);
      }
    }
    if (fnState) {
      result.levelFreezed = v.parse(LevelFreezeSchema13(), {
        notes: parseArrayOrEmpty(fnState.notes),
        rest: parseArrayOrEmpty(fnState.rest),
        bpmChanges: parseArrayOrEmpty(fnState.bpmChanges),
        speedChanges: parseArrayOrEmpty(fnState.speedChanges),
        signature: parseArrayOrEmpty(fnState.signature),
      });
      result.step = v.parse(StepSchema(), fnState.step);
    }
  } catch (e) {
    if (!options.catchError) {
      throw e;
    }
    result.err = String(e).split("\n");
    let firstErrorLine: number | null = null;
    // tracebackをパース
    result.err = result.err.map((s) => {
      const errorLineMatch = s.match(/\[string ".*"\]:(\d+):/);
      if (errorLineMatch !== null) {
        if (firstErrorLine === null) {
          firstErrorLine = Number(errorLineMatch[1]) - 1;
        }
        return s.replace(/\[string ".*"\]:(\d+):/, "$1:");
      }
      const errorLineMatchShort = s.match(/Error: (\d+):/);
      if (errorLineMatchShort !== null) {
        if (firstErrorLine === null) {
          firstErrorLine = Number(errorLineMatchShort[1]) - 1;
        }
      }
      return s;
    });
    result.errorLine = firstErrorLine;
  } finally {
    lua.global.close();
  }
  if (result.levelFreezed.bpmChanges.length === 0) {
    result.levelFreezed.bpmChanges.push({
      bpm: 120,
      step: stepZero(),
      luaLine: null,
    });
  }
  if (result.levelFreezed.speedChanges.length === 0) {
    result.levelFreezed.speedChanges.push({
      bpm: 120,
      step: stepZero(),
      luaLine: null,
      interp: false,
    });
  }
  if (result.levelFreezed.signature.length === 0) {
    result.levelFreezed.signature.push({
      step: stepZero(),
      offset: stepZero(),
      bars: [[4, 4, 4, 4]],
      luaLine: null,
    });
  }
  return result;
}
