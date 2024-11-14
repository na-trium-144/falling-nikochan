import { Level } from "../chart";
import { BPMChangeWithLua, NoteCommandWithLua, RestStep } from "../command";
import { luaAddBeatChange } from "../lua/signature";
import { stepZero } from "../step";
import { Chart5 } from "./chart5";

export interface Chart4 {
  falling: "nikochan"; // magic
  ver: 4;
  levels: Level4[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
  updatedAt: number;
}
export interface Level4 {
  name: string;
  type: string;
  hash: string;
  notes: NoteCommandWithLua[];
  rest: RestStep[];
  bpmChanges: BPMChangeWithLua[];
  speedChanges: BPMChangeWithLua[];
  lua: string[];
}

export function convert4To5(chart: Chart4): Chart5 {
  return {
    ...chart,
    ver: 5,
    levels: chart.levels.map((l) => {
      let newLevel: Level = { ...l, signature: [], unlisted: false };
      newLevel =
        luaAddBeatChange(newLevel, {
          step: stepZero(),
          offset: stepZero(),
          barNum: 0,
          bars: [[4, 4, 4, 4]],
        }) || newLevel;
      return newLevel;
    }),
  };
}
