import { BPMChangeWithLua3, NoteCommandWithLua3, RestStep3 } from "./chart3.js";
import { Chart5, SignatureWithLua5 } from "./chart5.js";

export interface Chart6 {
  falling: "nikochan"; // magic
  ver: 6;
  levels: Level6[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
  published: boolean;
}
export interface Level6 {
  name: string;
  type: string;
  notes: NoteCommandWithLua3[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  signature: SignatureWithLua5[];
  lua: string[];
  unlisted: boolean;
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
