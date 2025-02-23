import { LuaFactory } from "wasmoon";
import { Step, stepZero } from "../step.js";
import { luaAccel, luaBeat, luaBPM, luaNote, luaStep } from "./api.js";
import { updateBpmTimeSec } from "../bpm.js";
import { updateBarNum } from "../signature.js";
import { LevelFreeze } from "../chart.js";

export interface Result {
  stdout: string[];
  err: string[];
  errorLine: number | null;
  levelFreezed: LevelFreeze;
  step: Step;
}
export async function luaExec(
  code: string,
  catchError: boolean
): Promise<Result> {
  const factory = new LuaFactory();
  const lua = await factory.createEngine();
  const result: Result = {
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
    step: stepZero(),
  };
  try {
    lua.global.set("print", (...args: any[]) => {
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

    lua.global.set("Note", (...args: any[]) => luaNote(result, null, ...args));
    lua.global.set("NoteStatic", (...args: any[]) => luaNote(result, ...args));
    lua.global.set("Step", (...args: any[]) => luaStep(result, null, ...args));
    lua.global.set("StepStatic", (...args: any[]) => luaStep(result, ...args));
    lua.global.set("Beat", (...args: any[]) => luaBeat(result, null, ...args));
    lua.global.set("BeatStatic", (...args: any[]) => luaBeat(result, ...args));
    lua.global.set("BPM", (...args: any[]) => luaBPM(result, null, ...args));
    lua.global.set("BPMStatic", (...args: any[]) => luaBPM(result, ...args));
    lua.global.set("Accel", (...args: any[]) =>
      luaAccel(result, null, ...args)
    );
    lua.global.set("AccelStatic", (...args: any[]) =>
      luaAccel(result, ...args)
    );

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
        .replace(/^( *)Accel\(( *-?[\d.]+ *)\)( *)$/, `$1AccelStatic(${ln},$2)$3`)
    );
    console.log(codeStatic);
    await lua.doString(codeStatic.join("\n"));
  } catch (e) {
    if (!catchError) {
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
      timeSec: 0,
      luaLine: null,
    });
  }
  if (result.levelFreezed.speedChanges.length === 0) {
    result.levelFreezed.speedChanges.push({
      bpm: 120,
      step: stepZero(),
      timeSec: 0,
      luaLine: null,
    });
  }
  if (result.levelFreezed.signature.length === 0) {
    result.levelFreezed.signature.push({
      step: stepZero(),
      offset: stepZero(),
      barNum: 0,
      bars: [[4, 4, 4, 4]],
      luaLine: null,
    });
  }
  updateBpmTimeSec(
    result.levelFreezed.bpmChanges,
    result.levelFreezed.speedChanges
  );
  updateBarNum(result.levelFreezed.signature);
  return result;
}
