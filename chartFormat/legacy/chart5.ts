import { hash } from "../chart.js";
import { luaAddBeatChange } from "../lua/signature.js";
import { Step, stepZero } from "../step.js";
import { Chart1 } from "./chart1.js";
import { Chart2 } from "./chart2.js";
import {
  BPMChangeWithLua3,
  Chart3,
  NoteCommandWithLua3,
  RestStep3,
} from "./chart3.js";
import { Chart4, convertTo4 } from "./chart4.js";
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

export async function convertTo5(
  chart: Chart1 | Chart2 | Chart3 | Chart4
): Promise<Chart5> {
  if (chart.ver !== 4) chart = await convertTo4(chart);
  return {
    ...chart,
    ver: 5,
    levels: chart.levels.map((l) => {
      let newLevel: Level5 = { ...l, signature: [], unlisted: false };
      const change = luaAddBeatChange(newLevel, newLevel.lua, {
        step: stepZero(),
        offset: stepZero(),
        barNum: 0,
        bars: [[4, 4, 4, 4]],
      });
      if (change) {
        newLevel = { ...newLevel, ...change.chart, lua: change.lua };
      }
      return { ...newLevel, hash: l.hash };
    }),
  };
}
