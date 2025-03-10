import { hash } from "../chart.js";
import {
  BPMChangeWithLua3,
  ChartUntil3,
  convertTo3,
  NoteCommandWithLua3,
  RestStep3,
} from "./chart3.js";

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
  notes: NoteCommandWithLua3[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  lua: string[];
}

export async function hashLevel4(level: Level4) {
  return await hash(
    JSON.stringify([level.notes, level.bpmChanges, level.speedChanges])
  );
}

export type ChartUntil4 = ChartUntil3 | Chart4;
export async function convertTo4(chart: ChartUntil3): Promise<Chart4> {
  if (chart.ver !== 3) chart = convertTo3(chart);
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
