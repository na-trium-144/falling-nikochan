import { LuaFactory } from "wasmoon";
import { BPMChange, NoteCommand, updateBpmTimeSec } from "./command";
import { stepAdd, stepZero } from "./step";
import { emptyChart } from "./chart";

interface Result {
  stdout: string[];
  err: string[];
  notes: NoteCommand[];
  bpmChanges: BPMChange[];
}
export async function luaExec(code: string): Promise<Result> {
  const factory = new LuaFactory();
  const lua = await factory.createEngine();
  const result: Result = { stdout: [], err: [], notes: [], bpmChanges: [] };
  let currentStep = stepZero();
  try {
    lua.global.set("print", (...args: any[]) => {
      result.stdout.push(args.map((a) => String(a)).join("\t"));
    });
    lua.global.set("Note", (x: any, vx: any, vy: any, ay: any, big: any) => {
      if (
        typeof x === "number" &&
        typeof vx === "number" &&
        typeof vy === "number" &&
        typeof ay === "number" &&
        typeof big === "boolean"
      ) {
        result.notes.push({
          hitX: x,
          hitVX: vx,
          hitVY: vy,
          accelY: ay,
          big: !!big,
          step: { ...currentStep },
        } as NoteCommand);
      } else {
        throw "invalid argument for Note()";
      }
    });
    lua.global.set("BPM", (bpm: any) => {
      if(typeof bpm === "number"){
        result.bpmChanges.push({bpm: bpm, step: {...currentStep}, timeSec: 0});
      }else{
        throw "invalid argument for BPM()"
      }
          })
    lua.global.set("Step", (num: any, denom: any) => {
      if (
        typeof num === "number" &&
        typeof denom === "number" &&
        num >= 0 &&
        Math.floor(num) === num &&
        denom > 0 &&
        Math.floor(denom) === denom
      ) {
        currentStep = stepAdd(currentStep, {
          fourth: 0,
          numerator: num * 4,
          denominator: denom,
        });
      } else {
        throw "invalid argument for Step()";
      }
    });
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
