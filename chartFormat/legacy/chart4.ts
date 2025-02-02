import { hash, Level } from "../chart.js";
import { BPMChangeWithLua, NoteCommandWithLua, RestStep } from "../command.js";
import { luaAddBeatChange } from "../lua/signature.js";
import { stepZero } from "../step.js";
import { Chart5 } from "./chart5.js";

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
      return { ...newLevel, hash: l.hash };
    }),
  };
}

export async function hashLevel4(level: Level4) {
  return await hash(
    JSON.stringify([level.notes, level.bpmChanges, level.speedChanges])
  );
}
