import { hash } from "../chart.js";
import { Step } from "../step.js";
import { BPMChangeWithLua3, RestStep3 } from "./chart3.js";
import { SignatureWithLua5 } from "./chart5.js";
import { ChartUntil6, convertTo6 } from "./chart6.js";
import { Level8Edit } from "./chart8.js";

export interface Chart7 {
  falling: "nikochan"; // magic
  ver: 7;
  levels: Level7[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
  published: boolean;
  locale: string;
}
export interface Level7 {
  name: string;
  type: string;
  notes: NoteCommandWithLua7[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  signature: SignatureWithLua5[];
  lua: string[];
  unlisted: boolean;
}

export interface NoteCommand7 {
  step: Step;
  big: boolean;
  hitX: number;
  hitVX: number;
  hitVY: number;
  fall: boolean;
}
export interface NoteCommandWithLua7 extends NoteCommand7 {
  luaLine: number | null;
}

export async function hashLevel7(level: Level7 | Level8Edit) {
  return await hash(
    JSON.stringify([
      level.notes,
      level.bpmChanges,
      level.speedChanges,
      level.signature,
    ])
  );
}

export type ChartUntil7 = ChartUntil6 | Chart7;
export async function convertTo7(chart: ChartUntil6): Promise<Chart7> {
  if (chart.ver !== 6) chart = await convertTo6(chart);
  return {
    ...chart,
    levels: chart.levels.map((level) => ({
      ...level,
      notes: level.notes.map((note) => ({
        ...note,
        // 新規譜面のfallのデフォルト値はtrueだが、
        // 既存の譜面についてはfalseとする (luaを修正するのがめんどい)
        fall: false,
      })),
    })),
    locale: "ja", // ver6以前は日本語にしか対応していない
    ver: 7,
  };
}
