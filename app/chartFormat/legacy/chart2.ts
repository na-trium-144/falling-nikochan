import { Chart } from "../chart";
import { BPMChange } from "../command";
import { luaAddBpmChange } from "../lua/bpm";
import { luaAddNote } from "../lua/note";
import { luaAddSpeedChange } from "../lua/speed";
import { findBpmIndexFromStep, getTimeSec } from "../seq";
import { Step, stepZero } from "../step";
import { Chart3 } from "./chart3";

export interface Chart2 {
  falling: "nikochan"; // magic
  ver: 2;
  notes: NoteCommand2[];
  bpmChanges: BPMChange[];
  scaleChanges: BPMChange[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}
export interface NoteCommand2 {
  step: Step;
  big: boolean;
  hitX: number;
  hitVX: number;
  hitVY: number;
  accelY: number;
}

export function convert2To3(chart: Chart2): Chart3 {
  let newChart: Chart = {
    falling: "nikochan",
    ver: 3,
    notes: [],
    rest: [],
    bpmChanges: [],
    speedChanges: [],
    offset: chart.offset,
    lua: [],
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    editPasswd: chart.editPasswd,
  };
  for (const n of chart.bpmChanges) {
    newChart = luaAddBpmChange(newChart, n)!;
  }
  if (chart.bpmChanges.length === 0) {
    newChart = luaAddBpmChange(newChart, {
      bpm: 120,
      step: stepZero(),
      timeSec: 0,
    })!;
  }
  for (const n of chart.scaleChanges) {
    newChart = luaAddSpeedChange(newChart, n)!;
  }
  if (chart.scaleChanges.length === 0) {
    newChart = luaAddSpeedChange(newChart, {
      bpm: 120,
      step: stepZero(),
      timeSec: 0,
    })!;
  }
  for (const n of chart.notes) {
    const nScale2 = chart.scaleChanges[findBpmIndexFromStep(chart.scaleChanges, n.step)].bpm;
    const currentSpeed3 = newChart.speedChanges[findBpmIndexFromStep(newChart.speedChanges, n.step)].bpm;
    const newSpeed3 = Math.sqrt(nScale2 * nScale2 * n.accelY);
    const newVX = (nScale2 * n.hitVX) / newSpeed3;
    const newVY = (nScale2 * n.hitVY) / newSpeed3;
    if (currentSpeed3 !== newSpeed3) {
      newChart = luaAddSpeedChange(newChart, {
        bpm: newSpeed3,
        step: n.step,
        timeSec: getTimeSec(newChart.bpmChanges, n.step),
      })!;
    }
    newChart = luaAddNote(
      newChart,
      { hitX: n.hitX, hitVX: newVX, hitVY: newVY, step: n.step, big: n.big },
      n.step
    )!;
  }
  return newChart;
}
