import { BPMChangeWithLua3, NoteCommandWithLua3, RestStep3 } from "./chart3.js";
import { SignatureWithLua5 } from "./chart5.js";

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
}
export interface Level7 {
  name: string;
  type: string;
  notes: NoteCommandWithLua3[];
  rest: RestStep3[];
  bpmChanges: BPMChangeWithLua3[];
  speedChanges: BPMChangeWithLua3[];
  signature: SignatureWithLua5[];
  lua: string[];
  unlisted: boolean;
}
