import { Chart } from "../chart";
import { BPMChangeWithLua, NoteCommandWithLua, RestStep } from "../command";

export interface Chart3 {
  falling: "nikochan"; // magic
  ver: 3;
  notes: NoteCommandWithLua[];
  rest: RestStep[];
  bpmChanges: BPMChangeWithLua[];
  speedChanges: BPMChangeWithLua[];
  offset: number;
  lua: string[];
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}

export function convert3To4(chart: Chart3): Chart {
  return {
    falling: "nikochan",
    ver: 4,
    notes: chart.notes,
    rest: chart.rest,
    bpmChanges: chart.bpmChanges,
    speedChanges: chart.speedChanges,
    offset: chart.offset,
    lua: chart.lua,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    editPasswd: chart.editPasswd,
  };
}
