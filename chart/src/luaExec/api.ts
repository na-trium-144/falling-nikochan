import { Step, stepAdd, stepSimplify } from "../step.js";
import { Result } from "./exec.js";

export function luaNote(state: Result, ...args: any[]) {
  if (args.length === 5) {
    args.push(false);
  }
  if (
    args.length === 6 &&
    (typeof args[0] === "number" || args[0] === null) &&
    typeof args[1] === "number" &&
    typeof args[2] === "number" &&
    typeof args[3] === "number" &&
    typeof args[4] === "boolean" &&
    typeof args[5] === "boolean"
  ) {
    state.levelFreezed.notes.push({
      hitX: args[1],
      hitVX: args[2],
      hitVY: args[3],
      big: !!args[4],
      step: { ...state.step },
      luaLine: args[0],
      fall: args[5],
    });
  } else {
    throw "invalid argument for Note()";
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
    state.levelFreezed.rest.push({
      begin: { ...state.step },
      duration,
      luaLine: args[0],
    });
    state.step = stepAdd(state.step, duration);
  } else {
    throw "invalid argument for Step()";
  }
}

export function luaBeat(state: Result, ...args: any[]) {
  if (args.length === 2) {
    args.push(0);
    args.push(1);
  }
  if (
    args.length === 4 &&
    (typeof args[0] === "number" || args[0] === null) &&
    Array.isArray(args[1]) &&
    args[1].every(
      (x: any) =>
        Array.isArray(x) && x.every((b) => b === 4 || b === 8 || b === 16),
    ) &&
    typeof args[2] === "number" &&
    args[2] >= 0 &&
    typeof args[3] === "number" &&
    args[3] > 0
  ) {
    state.levelFreezed.signature.push({
      bars: args[1],
      offset: stepSimplify({
        fourth: 0,
        numerator: args[2] * 4,
        denominator: args[3],
      }),
      step: { ...state.step },
      barNum: 0,
      luaLine: args[0],
    });
  } else {
    throw "invalid argument for Beat()";
  }
}
export function luaBPM(state: Result, ...args: any[]) {
  if (
    args.length === 2 &&
    (typeof args[0] === "number" || args[0] === null) &&
    typeof args[1] === "number" &&
    args[1] > 0
  ) {
    state.levelFreezed.bpmChanges.push({
      bpm: args[1],
      step: { ...state.step },
      timeSec: 0,
      luaLine: args[0],
    });
  } else {
    throw "invalid argument for BPM()";
  }
}

export function luaAccel(state: Result, ...args: any[]) {
  if (
    args.length === 2 &&
    (typeof args[0] === "number" || args[0] === null) &&
    typeof args[1] === "number"
  ) {
    state.levelFreezed.speedChanges.push({
      bpm: args[1],
      step: { ...state.step },
      timeSec: 0,
      luaLine: args[0],
    });
  } else {
    throw "invalid argument for Accel()";
  }
}

export function luaVideoBeginAt(state: Result, ...args: any[]) {
  if (
    args.length === 2 &&
    (typeof args[0] === "number" || args[0] === null) &&
    typeof args[1] === "number"
  ) {
    state.levelFreezed.ytBegin = {
      timeSec: args[1],
      luaLine: args[0],
    };
  } else {
    throw "invalid argument for VideoBeginAt()";
  }
}
export function luaVideoEndAt(state: Result, ...args: any[]) {
  if (
    args.length === 2 &&
    (typeof args[0] === "number" || args[0] === null) &&
    typeof args[1] === "number"
  ) {
    state.levelFreezed.ytEnd = {
      timeSec: args[1],
      luaLine: args[0],
    };
  } else {
    throw "invalid argument for VideoEndAt()";
  }
}
export function luaVideoEndAuto(state: Result, ...args: any[]) {
  if (args.length === 1 && (typeof args[0] === "number" || args[0] === null)) {
    state.levelFreezed.ytEnd = {
      timeSec: "note",
      luaLine: args[0],
    };
  } else {
    throw "invalid argument for VideoEndAuto()";
  }
}
export function luaVideoEndFull(state: Result, ...args: any[]) {
  if (args.length === 1 && (typeof args[0] === "number" || args[0] === null)) {
    state.levelFreezed.ytEnd = {
      timeSec: "yt",
      luaLine: args[0],
    };
  } else {
    throw "invalid argument for VideoEndFull()";
  }
}
