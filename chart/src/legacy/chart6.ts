import { BPMChangeWithLua3, NoteCommandWithLua3, RestStep3 } from "./chart3.js";
import { ChartUntil5, convertTo5, SignatureWithLua5 } from "./chart5.js";

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
export interface Level6Play extends Level6 {
  ver: 6;
  offset: number;
}

export type ChartUntil6 = ChartUntil5 | Chart6;
export async function convertTo6(chart: ChartUntil5): Promise<Chart6> {
  if (chart.ver !== 5) chart = await convertTo5(chart);
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
