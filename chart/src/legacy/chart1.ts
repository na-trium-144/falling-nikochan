import { Step, StepSchema } from "../step.js";
import * as v from "valibot";

export interface Chart1 {
  falling: "nikochan"; // magic
  ver: 1;
  notes: NoteCommand1[];
  bpmChanges: BPMChange1[];
  offset: number;
  waveOffset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}
export interface NoteCommand1 {
  step: Step;
  big: boolean;
  hitX: number;
  hitVX: number;
  hitVY: number;
  accelY: number;
}
export interface BPMChange1 {
  step: Step;
  timeSec: number;
  bpm: number;
}

export const BPMChange1Schema = () =>
  v.object({
    step: StepSchema(),
    timeSec: v.number(),
    bpm: v.number(),
  });
