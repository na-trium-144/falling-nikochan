import { NoteCommand } from "../command";
import { stepAdd } from "../step";
import { Result } from "./exec";

export function luaNote(state: Result, ...args: any[]) {
  if (
    args.length === 5 &&
    typeof args[0] === "number" &&
    typeof args[1] === "number" &&
    typeof args[2] === "number" &&
    typeof args[3] === "number" &&
    typeof args[4] === "boolean"
  ) {
    state.notes.push({
      hitX: args[0],
      hitVX: args[1],
      hitVY: args[2],
      accelY: args[3],
      big: !!args[4],
      step: { ...state.step },
    } as NoteCommand);
  } else {
    throw "invalid argument for Note()";
  }
}

export function luaBPM(state: Result, ...args: any[]) {
  if (args.length === 1 && typeof args[0] === "number") {
    state.bpmChanges.push({
      bpm: args[0],
      step: { ...state.step },
      timeSec: 0,
    });
  } else {
    throw "invalid argument for BPM()";
  }
}

export function luaStep(state: Result, ...args: any[]) {
  if (
    args.length === 2 &&
    typeof args[0] === "number" &&
    typeof args[1] === "number" &&
    args[0] >= 0 &&
    Math.floor(args[0]) === args[0] &&
    args[1] > 0 &&
    Math.floor(args[1]) === args[1]
  ) {
    state.step = stepAdd(state.step, {
      fourth: 0,
      numerator: args[0] * 4,
      denominator: args[1],
    });
  } else {
    throw "invalid argument for Step()";
  }
}
