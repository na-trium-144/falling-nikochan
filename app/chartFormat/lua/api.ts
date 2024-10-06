import { NoteCommand, NoteCommandWithLua } from "../command";
import { Step, stepAdd } from "../step";
import { Result } from "./exec";

export function luaNote(state: Result, ...args: any[]) {
  if (
    args.length === 6 &&
    (typeof args[0] === "number" || args[0] === null) &&
    typeof args[1] === "number" &&
    typeof args[2] === "number" &&
    typeof args[3] === "number" &&
    typeof args[4] === "number" &&
    typeof args[5] === "boolean"
  ) {
    state.notes.push({
      hitX: args[1],
      hitVX: args[2],
      hitVY: args[3],
      accelY: args[4],
      big: !!args[5],
      step: { ...state.step },
      luaLine: args[0],
    } as NoteCommandWithLua);
  } else {
    throw "invalid argument for Note()";
  }
}

export function luaBPM(state: Result, ...args: any[]) {
  if (
    args.length === 2 &&
    (typeof args[0] === "number" || args[0] === null) &&
    typeof args[1] === "number" &&
    args[1] > 0
  ) {
    state.bpmChanges.push({
      bpm: args[1],
      step: { ...state.step },
      timeSec: 0,
      luaLine: args[0],
    });
  } else {
    throw "invalid argument for BPM()";
  }
}

export function luaStep(state: Result, ...args: any[]) {
  if (
    args.length === 3 &&
    (typeof args[0] === "number" || args[0] === null) &&
    typeof args[1] === "number" &&
    typeof args[2] === "number" &&
    args[1] >= 0 &&
    Math.floor(args[1]) === args[1] &&
    args[2] > 0 &&
    Math.floor(args[2]) === args[2]
  ) {
    const duration: Step = {
      fourth: 0,
      numerator: args[1] * 4,
      denominator: args[2],
    };
    state.rest.push({
      begin: { ...state.step },
      duration,
      luaLine: args[0],
    });
    state.step = stepAdd(state.step, duration);
  } else {
    throw "invalid argument for Step()";
  }
}
