import { BPMChangeWithLua, NoteCommandWithLua, RestStep } from "../command";
import { Chart4 } from "./chart4";

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

export function convert3To4(chart: Chart3): Chart4 {
  return {
    falling: "nikochan",
    ver: 4,
    levels: [{
      name: "",
      type: "Single",
      notes: chart.notes,
      rest: chart.rest,
      bpmChanges: chart.bpmChanges,
      speedChanges: chart.speedChanges,
      lua: chart.lua,
    }],
    offset: chart.offset,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    editPasswd: chart.editPasswd,
  };
}
