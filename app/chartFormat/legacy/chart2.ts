import { BPMChange, NoteCommand } from "../command";
import { Step, validateStep } from "../step";

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
