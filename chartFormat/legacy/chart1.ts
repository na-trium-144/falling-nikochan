import { Step } from "../step.js";

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
