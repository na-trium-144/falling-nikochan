import { BPMChange1, Chart1 } from "./chart1.js";
import { Chart2 } from "./chart2.js";
import { BPMChangeWithLua3, Chart3, RestStep3 } from "./chart3.js";
import { Chart4 } from "./chart4.js";
import { Chart5, Signature5, SignatureWithLua5 } from "./chart5.js";
import { Chart6 } from "./chart6.js";
import {
  Chart7,
  convertTo7,
  NoteCommand7,
  NoteCommandWithLua7,
} from "./chart7.js";

export interface Chart8Min {
  falling: "nikochan"; // magic
  ver: 8;
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  locale: string;
  levels: Level8Min[];
}
export interface Level8Min {
  name: string;
  type: string;
  lua: string[];
  unlisted: boolean;
}

export interface Chart8Edit extends Chart8Min {
  levels: Level8Edit[];
  editPasswd: string;
  published: boolean;
}
export interface Level8Freeze {
  notes: NoteCommandWithLua7[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  signature: SignatureWithLua5[];
}
export type Level8Edit = Level8Min & Level8Freeze;

export interface Level8Play {
  ver: 8;
  notes: NoteCommand7[];
  bpmChanges: BPMChange1[];
  speedChanges: BPMChange1[];
  signature: Signature5[];
  offset: number;
}
export function convertToPlay8(chart: Chart8Edit, lvIndex: number): Level8Play {
  const level = chart.levels[lvIndex];
  return {
    ver: 8,
    offset: chart.offset,
    notes:
      level?.notes.map((note) => ({
        step: note.step,
        big: note.big,
        hitX: note.hitX,
        hitVX: note.hitVX,
        hitVY: note.hitVY,
        fall: note.fall,
      })) || [],
    bpmChanges:
      level?.bpmChanges.map((change) => ({
        bpm: change.bpm,
        step: change.step,
        timeSec: change.timeSec,
      })) || [],
    speedChanges:
      level?.speedChanges.map((change) => ({
        bpm: change.bpm,
        step: change.step,
        timeSec: change.timeSec,
      })) || [],
    signature:
      level?.signature.map((s) => ({
        step: s.step,
        offset: s.offset,
        barNum: s.barNum,
        bars: s.bars,
      })) || [],
  };
}

export function convertToMin8(chart: Chart8Edit): Chart8Min {
  return {
    falling: "nikochan",
    ver: 8,
    offset: chart.offset,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    locale: chart.locale,
    levels: chart.levels.map((level) => ({
      name: level.name,
      type: level.type,
      unlisted: level.unlisted,
      lua: level.lua,
    })),
  };
}
export async function convertTo8(
  chart: Chart1 | Chart2 | Chart3 | Chart4 | Chart5 | Chart6 | Chart7
): Promise<Chart8Edit> {
  if (chart.ver !== 7) chart = await convertTo7(chart);
  return {
    falling: "nikochan",
    ver: 8,
    offset: chart.offset,
    ytId: chart.ytId,
    title: chart.title,
    composer: chart.composer,
    chartCreator: chart.chartCreator,
    locale: chart.locale,
    levels: chart.levels.map((level) => ({
      name: level.name,
      type: level.type,
      lua: level.lua,
      unlisted: level.unlisted,
      notes: level.notes,
      rest: level.rest,
      bpmChanges: level.bpmChanges,
      speedChanges: level.speedChanges,
      signature: level.signature,
    })),
    editPasswd: chart.editPasswd,
    published: chart.published,
  };
}
