import { hash } from "../chart.js";
import { Step } from "../step.js";
import { BPMChangeWithLua3, RestStep3 } from "./chart3.js";
import { SignatureWithLua5 } from "./chart5.js";
import { Chart6 } from "./chart6.js";

export interface Chart7 {
  falling: "nikochan"; // magic
  ver: 7;
  levels: Level7[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
  published: boolean;
}
export interface Level7 {
  name: string;
  type: string;
  notes: NoteCommandWithLua7[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  signature: SignatureWithLua5[];
  lua: string[];
  unlisted: boolean;
}

export interface NoteCommand7 {
  step: Step;
  big: boolean;
  hitX: number;
  hitVX: number;
  hitVY: number;
  fall: boolean;
}
export interface NoteCommandWithLua7 extends NoteCommand7 {
  luaLine: number | null;
}

export async function hashLevel7(level: Level7) {
  return await hash(
    JSON.stringify([
      level.notes,
      level.bpmChanges,
      level.speedChanges,
      level.signature,
    ])
  );
}

export function convert6To7(chart: Chart6): Chart7 {
  return {
    ...chart,
    levels: chart.levels.map((level) => ({
      ...level,
      notes: level.notes.map((note) => ({
        ...note,
        fall: true, //todo!,
      })),
    })),
    ver: 7,
    published: false,
  };
}
