import {
  BPMChangeWithLua,
  NoteCommandWithLua,
  RestStep,
  SignatureWithLua,
} from "../command";
import { Chart6 } from "./chart6";

export interface Chart5 {
  falling: "nikochan"; // magic
  ver: 5;
  levels: Level5[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
  updatedAt: number;
}
export interface Level5 {
  name: string;
  type: string;
  hash: string;
  notes: NoteCommandWithLua[];
  rest: RestStep[];
  bpmChanges: BPMChangeWithLua[];
  speedChanges: BPMChangeWithLua[];
  signature: SignatureWithLua[];
  lua: string[];
  unlisted?: boolean;
}

export function convert5To6(chart: Chart5): Chart6 {
  return {
    ...chart,
    levels: chart.levels.map((level) => ({
      ...level,
      unlisted: !!level.unlisted,
    })),
    ver: 6,
    published: false,
  };
}
