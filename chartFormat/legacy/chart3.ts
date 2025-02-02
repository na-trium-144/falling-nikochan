import { BPMChangeWithLua, NoteCommandWithLua, RestStep } from "../command.js";
import { Chart4, hashLevel4 } from "./chart4.js";

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

export async function convert3To4(chart: Chart3): Promise<Chart4> {
  const newChart: Chart4 = {
    falling: "nikochan",
    ver: 4,
    levels: [
      {
        name: "",
        hash: "",
        type: "Single",
        notes: chart.notes,
        rest: chart.rest,
        bpmChanges: chart.bpmChanges,
        speedChanges: chart.speedChanges,
        lua: chart.lua,
      },
    ],
    offset: chart.offset,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    editPasswd: chart.editPasswd,
    updatedAt: 0,
  };
  newChart.levels[0].hash = await hashLevel4(newChart.levels[0]);
  return newChart;
}
