import { LuaFactory } from "wasmoon";
import { BPMChange, NoteCommand, updateBpmTimeSec } from "../command";
import { Step, stepAdd, stepZero } from "../step";
import { emptyChart } from "../chart";
import { luaBPM, luaNote, luaStep } from "./api";

export interface Result {
  stdout: string[];
  err: string[];
  notes: NoteCommand[];
  bpmChanges: BPMChange[];
  step: Step;
}
export async function luaExec(code: string): Promise<Result> {
  const factory = new LuaFactory();
  const lua = await factory.createEngine();
  const result: Result = { stdout: [], err: [], notes: [], bpmChanges: [], step: stepZero() };
  try {
    lua.global.set("print", (...args: any[]) => {
      result.stdout.push(args.map((a) => String(a)).join("\t"));
    });
    lua.global.set("Note", (...args: any[]) => luaNote(result, ...args));
    lua.global.set("BPM", (...args: any[]) => luaBPM(result, ...args));
    lua.global.set("Step", (...args: any[]) => luaStep(result, ...args));
    // lua.global.set('sum', (x, y) => x + y)
    await lua.doString(code);
  } catch (e) {
    result.err = String(e).split("\n");
  } finally {
    lua.global.close();
  }
  updateBpmTimeSec(result.bpmChanges, []);
  if (result.bpmChanges.length === 0){
    result.bpmChanges = emptyChart().bpmChanges;
  }
  return result;
}
