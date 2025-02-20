import { emptyLevel } from "../chart.js";
import { luaAddBpmChange } from "../lua/bpm.js";
import { luaAddNote } from "../lua/note.js";
import { luaAddSpeedChange } from "../lua/speed.js";
import { findBpmIndexFromStep, getTimeSec } from "../seq.js";
import { Step, stepZero } from "../step.js";
import { BPMChange1, Chart1 } from "./chart1.js";
import { Chart2, convertTo2 } from "./chart2.js";

export interface Chart3 {
  falling: "nikochan"; // magic
  ver: 3;
  notes: NoteCommandWithLua3[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  offset: number;
  lua: string[];
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}

export interface BPMChangeWithLua3 extends BPMChange1 {
  luaLine: number | null;
}
export interface NoteCommand3 {
  step: Step;
  big: boolean;
  hitX: number;
  hitVX: number;
  hitVY: number;
}
export interface NoteCommandWithLua3 extends NoteCommand3 {
  luaLine: number | null;
}
export interface RestStep3 {
  begin: Step;
  duration: Step;
  luaLine: number | null;
}

export function convertTo3(chart: Chart1 | Chart2): Chart3 {
  if (chart.ver !== 2) chart = convertTo2(chart);
  let newChart: Chart3 = {
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
    const { chart, lua } = luaAddBpmChange(
      { ...emptyLevel(), ...newChart },
      newChart.lua,
      n
    )!;
    newChart = {
      ...newChart,
      ...chart,
      lua,
    };
  }
  if (chart.bpmChanges.length === 0) {
    const { chart, lua } = luaAddBpmChange(
      { ...emptyLevel(), ...newChart },
      newChart.lua,
      {
        bpm: 120,
        step: stepZero(),
        timeSec: 0,
      }
    )!;
    newChart = {
      ...newChart,
      ...chart,
      lua,
    };
  }
  for (const n of chart.scaleChanges) {
    const { chart, lua } = luaAddSpeedChange(
      { ...emptyLevel(), ...newChart },
      newChart.lua,
      n
    )!;
    newChart = {
      ...newChart,
      ...chart,
      lua,
    };
  }
  if (chart.scaleChanges.length === 0) {
    const { chart, lua } = luaAddSpeedChange(
      { ...emptyLevel(), ...newChart },
      newChart.lua,
      {
        bpm: 120,
        step: stepZero(),
        timeSec: 0,
      }
    )!;
    newChart = {
      ...newChart,
      ...chart,
      lua,
    };
  }
  for (const n of chart.notes) {
    const nScale2 =
      chart.scaleChanges[findBpmIndexFromStep(chart.scaleChanges, n.step)].bpm;
    const currentSpeed3 =
      newChart.speedChanges[findBpmIndexFromStep(newChart.speedChanges, n.step)]
        .bpm;
    const newSpeed3 = Math.sqrt(nScale2 * nScale2 * n.accelY);
    const newVX = (nScale2 * n.hitVX) / newSpeed3;
    const newVY = (nScale2 * n.hitVY) / newSpeed3;
    if (currentSpeed3 !== newSpeed3) {
      const { chart, lua } = luaAddSpeedChange(
        { ...emptyLevel(), ...newChart },
        newChart.lua,
        {
          bpm: newSpeed3,
          step: n.step,
          timeSec: getTimeSec(newChart.bpmChanges, n.step),
        }
      )!;
      newChart = {
        ...newChart,
        ...chart,
        lua,
      };
    }
    {
      const { chart, lua } = luaAddNote(
        { ...emptyLevel(), ...newChart },
        newChart.lua,
        { hitX: n.hitX, hitVX: newVX, hitVY: newVY, step: n.step, big: n.big },
        n.step
      )!;
      newChart = {
        ...newChart,
        ...chart,
        lua,
      };
    }
  }
  return newChart;
}
