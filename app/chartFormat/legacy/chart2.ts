import { BPMChange, NoteCommand } from "../command";
import { Step, validateStep } from "../step";

export interface Chart2 {
  falling: "nikochan"; // magic
  ver: 2;
  notes: NoteCommand[];
  bpmChanges: BPMChange[];
  scaleChanges: BPMChange[];
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
}
