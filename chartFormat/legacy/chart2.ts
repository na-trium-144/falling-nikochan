import { stepZero } from "../step.js";
import { BPMChange1, Chart1, NoteCommand1 } from "./chart1.js";

export interface Chart2 {
  falling: "nikochan"; // magic
  ver: 2;
  notes: NoteCommand1[];
  bpmChanges: BPMChange1[];
  scaleChanges: BPMChange1[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}

export function convert1To2(chart: Chart1): Chart2 {
  return {
    falling: "nikochan",
    ver: 2,
    notes: chart.notes.map((n) => ({
      step: n.step,
      big: n.big,
      hitX: n.hitX * 10 - 5,
      hitVX: n.hitVX * 4,
      hitVY: n.hitVY * 4,
      accelY: n.accelY * 4,
    })),
    bpmChanges: chart.bpmChanges,
    scaleChanges: [{ step: stepZero(), timeSec: 0, bpm: 120 }],
    offset: chart.offset,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    editPasswd: chart.editPasswd,
  };
}
