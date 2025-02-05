import { hash } from "../chart.js";
import { luaAddBeatChange } from "../lua/signature.js";
import { Step, stepZero } from "../step.js";
import { BPMChangeWithLua3, NoteCommandWithLua3, RestStep3 } from "./chart3.js";
import { Chart4 } from "./chart4.js";
import { Level6 } from "./chart6.js";

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
  notes: NoteCommandWithLua3[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  signature: SignatureWithLua5[];
  lua: string[];
  unlisted?: boolean;
}
export interface Signature5 {
  step: Step;
  offset: Step;
  barNum: number;
  bars: (4 | 8 | 16)[][];
}
export interface SignatureWithLua5 extends Signature5 {
  luaLine: number | null;
}

export async function hashLevel5(level: Level5 | Level6) {
  return await hash(
    JSON.stringify([
      level.notes,
      level.bpmChanges,
      level.speedChanges,
      level.signature,
    ])
  );
}

export function convert4To5(chart: Chart4): Chart5 {
  return {
    ...chart,
    ver: 5,
    levels: chart.levels.map((l) => {
      let newLevel: Level5 = { ...l, signature: [], unlisted: false };
      newLevel =
        (luaAddBeatChange(newLevel, {
          step: stepZero(),
          offset: stepZero(),
          barNum: 0,
          bars: [[4, 4, 4, 4]],
        }) as Level5) || newLevel;
      return { ...newLevel, hash: l.hash };
    }),
  };
}
