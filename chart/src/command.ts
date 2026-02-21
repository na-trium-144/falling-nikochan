import { CopyBuffer, NoteCommand15, NoteCommandWithLua15, Rest15, RestWithLua15 } from "./legacy/chart15.js";
import { Step, stepZero } from "./step.js";

export type NoteCommand = NoteCommand15;
export type NoteCommandWithLua = NoteCommandWithLua15;

export function defaultNoteCommand(
  currentStep: Step = stepZero()
): NoteCommandWithLua {
  return {
    step: currentStep,
    big: false,
    hitX: -3,
    hitVX: +1,
    hitVY: +3,
    fall: true,
    luaLine: null,
  };
}

export type RestStep = Rest15;
export type RestStepWithLua = RestWithLua15;

export function defaultCopyBuffer() {
  return ([defaultNoteCommand()] as (NoteCommandWithLua | null)[]).concat(
    Array.from(new Array(9)).map(() => null)
  );
}
export function defaultCopyBufferObj(): CopyBuffer {
  return { "0": [-3, 1, 3, false, true] };
}
