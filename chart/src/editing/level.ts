import { EventEmitter } from "eventemitter3";
import { EventType, eventTypes, LuaExecutorRef } from "./types.js";
import { CursorState } from "./cursor.js";
import {
  currentChartVer,
  LevelEdit,
  LevelFreeze,
  LevelMin,
  LevelPlay,
} from "../chart.js";
import { findInsertLine, LevelForLuaEditLatest } from "../lua/edit.js";
import {
  findBpmIndexFromStep,
  getSignatureState,
  getTimeSec,
  loadChart,
  Note,
} from "../seq.js";
import { difficulty } from "../difficulty.js";
import { Step, stepAdd, stepCmp, stepZero } from "../step.js";
import {
  luaAddBpmChange,
  luaDeleteBpmChange,
  luaUpdateBpmChange,
} from "../lua/bpm.js";
import {
  luaAddSpeedChange,
  luaDeleteSpeedChange,
  luaUpdateSpeedChange,
} from "../lua/speed.js";
import { Signature } from "../signature.js";
import {
  luaAddBeatChange,
  luaDeleteBeatChange,
  luaUpdateBeatChange,
} from "../lua/signature.js";
import { NoteCommand } from "../command.js";
import { luaAddNote, luaDeleteNote, luaUpdateNote } from "../lua/note.js";

export class LevelEditing extends EventEmitter<EventType> {
  // これは親のChartEditingと同期
  #offset: () => number;
  #luaExecutorRef: LuaExecutorRef;
  // 以下の編集には updateMeta(), updateFreeze(), updateLua() を使う
  #meta: Omit<LevelMin, "lua">;
  #lua: string[];
  #freeze: LevelFreeze;

  constructor(
    level: LevelEdit,
    parentEmit: (type: EventType) => void,
    offset: () => number,
    luaExecutorRef: LuaExecutorRef
  ) {
    super();
    for (const type of eventTypes) {
      this.on(type, () => parentEmit(type));
    }
    this.#offset = offset;
    this.#luaExecutorRef = luaExecutorRef;

    this.#meta = {
      name: level.name,
      type: level.type,
      unlisted: level.unlisted,
      ytBegin: level.ytBegin,
      ytEnd: level.ytEnd,
      ytEndSec: level.ytEndSec,
    };
    this.#lua = level.lua;
    this.#freeze = {
      notes: level.notes,
      rest: level.rest,
      bpmChanges: level.bpmChanges,
      speedChanges: level.speedChanges,
      signature: level.signature,
    };
    // 以下はupdateFreeze()内で初期化される
    this.#seqNotes = [];
    this.#difficulty = 0;
    this.#maxHitNum = 1;
    this.#lengthSec = 0;
    this.#ytDuration = 0;
    this.#barLines = [];
    this.#current = new CursorState((type) => this.emit(type));

    this.resetYTEnd();
    this.updateMeta({});
    this.updateFreeze({});
  }
  toObject(): LevelEdit {
    return {
      name: this.#meta.name,
      type: this.#meta.type,
      unlisted: this.#meta.unlisted,
      ytBegin: this.#meta.ytBegin,
      ytEnd: this.#meta.ytEnd,
      ytEndSec: this.#meta.ytEndSec,
      notes: this.#freeze.notes,
      rest: this.#freeze.rest,
      bpmChanges: this.#freeze.bpmChanges,
      speedChanges: this.#freeze.speedChanges,
      signature: this.#freeze.signature,
      lua: this.#lua,
    };
  }

  #luaEditData(): LevelForLuaEditLatest {
    return JSON.parse(
      JSON.stringify({
        ...this.#freeze,
        lua: this.#lua,
      } satisfies LevelForLuaEditLatest)
    );
  }

  updateMeta(newMeta: Partial<Omit<LevelMin, "lua">>) {
    this.#meta = { ...this.#meta, ...newMeta };
    if ("ytEnd" in newMeta) {
      this.resetYTEnd();
    }
    this.emit("rerender");
    this.emit("change");
  }
  updateFreeze(newFreeze: Partial<LevelFreeze>) {
    this.#freeze = { ...this.#freeze, ...newFreeze };
    this.#current.reset(
      this.#current.timeSec,
      this.#current.snapDivider,
      this.#freeze,
      this.#lua
    );
    this.#resetBarLines();
    this.#resetSeqNotes();
    this.#resetDifficulty();
    this.#resetLengthSec();
    this.emit("rerender");
    this.emit("change");
  }
  async updateLua(lua: string[]) {
    this.#luaExecutorRef.current.abortExec();
    const levelFreezed = await this.#luaExecutorRef.current.exec(
      lua.join("\n")
    );
    if (levelFreezed) {
      this.#lua = lua;
      this.updateFreeze(levelFreezed);
    }
  }

  get meta() {
    return { ...this.#meta } as const;
  }
  get freeze() {
    return { ...this.#freeze } as const;
  }
  get lua() {
    return [...this.#lua] as const;
  }

  #seqNotes: Note[];
  #resetSeqNotes() {
    this.#seqNotes = loadChart({
      ver: currentChartVer,
      offset: this.#offset(),
      ...this.#freeze,
      ...this.#meta,
    } satisfies LevelPlay).notes;
  }
  get seqNotes() {
    return [...this.#seqNotes] as const;
  }

  #difficulty: number;
  #resetDifficulty() {
    this.#difficulty = difficulty(this.toObject(), this.#meta.type);
  }
  get difficulty() {
    return this.#difficulty;
  }

  #maxHitNum: number;
  #resetMaxHitNum() {
    let prevStep: Step = { fourth: -1, numerator: 0, denominator: 4 };
    this.#maxHitNum = 1;
    let hitNum = 0;
    for (let i = 0; i < this.#freeze.notes.length; i++) {
      const n = this.#freeze.notes[i];
      if (stepCmp(prevStep, n.step) < 0) {
        prevStep = n.step;
        hitNum = 1;
        continue;
      } else if (stepCmp(prevStep, n.step) == 0) {
        hitNum++;
        this.#maxHitNum = Math.max(hitNum, this.#maxHitNum);
      }
    }
  }
  get maxHitNum() {
    return this.#maxHitNum;
  }

  #lengthSec: number;
  #resetLengthSec() {
    this.#lengthSec = 0;
    if (this.#freeze.notes.length > 0) {
      this.#lengthSec =
        getTimeSec(this.#freeze.bpmChanges, this.#freeze.notes.at(-1)!.step) +
        this.#offset();
    }
    this.resetYTEnd();
    this.emit("rerender");
  }
  get lengthSec() {
    return this.#lengthSec;
  }
  #ytDuration: number;
  setYTDuration(duration: number) {
    if (this.#ytDuration !== duration) {
      this.#ytDuration = duration;
      this.resetYTEnd();
      this.emit("rerender");
    }
  }
  get ytDuration() {
    return this.#ytDuration;
  }
  resetYTEnd() {
    if (
      this.#meta.ytEnd === "note" &&
      this.#meta.ytEndSec !== this.#lengthSec
    ) {
      this.updateMeta({ ytEndSec: this.#lengthSec });
    }
    if (this.#meta.ytEnd === "yt" && this.#meta.ytEndSec !== this.#ytDuration) {
      this.updateMeta({ ytEndSec: this.#ytDuration });
    }
    if (
      typeof this.#meta.ytEnd === "number" &&
      this.#meta.ytEndSec !== this.#meta.ytEnd
    ) {
      this.updateMeta({ ytEndSec: this.#meta.ytEnd });
    }
  }

  // それぞれの小節線位置のコード内での行番号
  #barLines: { barNum: number; luaLine: number }[];
  #resetBarLines() {
    const barLines: { barNum: number; luaLine: number }[] = [];
    let step = stepZero();
    const lastRest = this.#freeze.rest.at(this.#freeze.rest.length - 1)?.begin;
    while (lastRest !== undefined && stepCmp(step, lastRest) <= 0) {
      const ss = getSignatureState(this.#freeze.signature, step);
      if (stepCmp(ss.offset, stepZero()) === 0) {
        const line = findInsertLine(
          { ...this.#freeze, lua: this.#lua },
          step,
          false
        ).luaLine;
        if (line !== null) {
          barLines.push({ barNum: ss.barNum + 1, luaLine: line });
        }
      }
      step = stepAdd(step, { fourth: 0, numerator: 1, denominator: 4 });
    }
    this.#barLines = barLines;
    this.emit("rerender");
  }
  get barLines() {
    return [...this.#barLines] as const;
  }

  #current: CursorState;
  setCurrentTimeWithoutOffset(
    timeSecWithoutOffset: number,
    snapDivider?: number
  ) {
    const timeSec = timeSecWithoutOffset - this.#offset();
    if (snapDivider === undefined) {
      snapDivider = this.#current.snapDivider;
    }
    if (
      this.#current.timeSec != timeSec ||
      this.#current.snapDivider != snapDivider
    ) {
      this.#current.reset(timeSec, snapDivider, this.#freeze, this.#lua);
    }
  }
  setSnapDivider(snapDivider: number) {
    this.#current.reset(
      this.#current.timeSec,
      snapDivider,
      this.#freeze,
      this.#lua
    );
  }
  selectNextNote() {
    if (this.#current.noteIndex !== undefined) {
      this.#current.setNoteIndex(this.#current.noteIndex + 1);
    }
  }
  selectPrevNote() {
    if (this.#current.noteIndex !== undefined && this.#current.noteIndex >= 1) {
      this.#current.setNoteIndex(this.#current.noteIndex - 1);
    }
  }
  get current() {
    return this.#current;
  }

  get currentNote() {
    if (this.#current.noteIndex !== undefined && this.#current.noteIndex >= 0) {
      return this.#freeze.notes.at(this.#current.noteIndex);
    } else {
      return undefined;
    }
  }
  get currentNoteEditable() {
    return !!this.currentNote && this.currentNote.luaLine !== null;
  }
  get nextNote() {
    if (this.#current.noteIndex !== undefined) {
      return this.#freeze.notes.at(this.#current.noteIndex + 1);
    } else {
      return undefined;
    }
  }
  get prevNote() {
    if (this.#current.noteIndex !== undefined && this.#current.noteIndex >= 1) {
      return this.#freeze.notes.at(this.#current.noteIndex - 1);
    } else {
      return undefined;
    }
  }
  get currentSeqNote() {
    if (this.#current.noteIndex !== undefined && this.#current.noteIndex >= 0) {
      return this.seqNotes.at(this.#current.noteIndex);
    } else {
      return undefined;
    }
  }
  get currentBpmChange() {
    return this.#freeze.bpmChanges.at(this.#current.bpmIndex);
  }
  get currentBpm() {
    return this.currentBpmChange?.bpm;
  }
  get currentBpmEditable() {
    return !!this.currentBpmChange && this.currentBpmChange.luaLine !== null;
  }
  get prevBpmChange() {
    return this.#current.bpmIndex > 0
      ? this.#freeze.bpmChanges.at(this.#current.bpmIndex - 1)
      : undefined;
  }
  get prevBpm() {
    return this.prevBpmChange?.bpm;
  }
  findBpmChangeFromStep(s: Step) {
    if (stepCmp(s, stepZero()) > 0) {
      const i = findBpmIndexFromStep(this.#freeze.bpmChanges, s);
      if (i !== undefined) {
        return this.#freeze.bpmChanges.at(i);
      }
    }
    return undefined;
  }
  get currentSpeedChange() {
    return this.#freeze.speedChanges.at(this.#current.speedIndex);
  }
  get currentSpeed() {
    return this.currentSpeedChange?.bpm;
  }
  get currentSpeedInterp() {
    return this.currentSpeedChange?.interp;
  }
  get currentSpeedEditable() {
    return (
      !!this.currentSpeedChange && this.currentSpeedChange.luaLine !== null
    );
  }
  get prevSpeedChange() {
    return this.#current.speedIndex > 0
      ? this.#freeze.speedChanges.at(this.#current.speedIndex - 1)
      : undefined;
  }
  get prevSpeed() {
    return this.prevSpeedChange?.bpm;
  }
  get nextSpeedChange() {
    return this.#freeze.speedChanges.at(this.#current.speedIndex + 1);
  }
  get nextSpeed() {
    return this.nextSpeedChange?.bpm;
  }
  get nextSpeedInterp() {
    return this.nextSpeedChange?.interp;
  }
  findSpeedChangeFromStep(s: Step) {
    if (stepCmp(s, stepZero()) > 0) {
      const i = findBpmIndexFromStep(this.#freeze.speedChanges, s);
      if (i !== undefined) {
        return this.#freeze.speedChanges.at(i);
      }
    }
    return undefined;
  }
  get currentSignature() {
    return this.#freeze.signature.at(this.#current.signatureIndex);
  }
  get currentSignatureEditable() {
    return !!this.currentSignature && this.currentSignature.luaLine !== null;
  }
  get prevSignature() {
    return this.#current.signatureIndex > 0
      ? this.#freeze.signature.at(this.#current.signatureIndex - 1)
      : undefined;
  }
  findSignatureFromStep(s: Step) {
    if (stepCmp(s, stepZero()) > 0) {
      const i = findBpmIndexFromStep(this.#freeze.signature, s);
      if (i !== undefined) {
        return this.#freeze.signature.at(i);
      }
    }
    return undefined;
  }
  get bpmChangeHere() {
    const currentBpmStep = this.#freeze.bpmChanges.at(
      this.#current.bpmIndex
    )?.step;
    return currentBpmStep && stepCmp(currentBpmStep, this.#current.step) === 0;
  }
  get speedChangeHere() {
    const currentSpeedStep = this.#freeze.speedChanges.at(
      this.#current.speedIndex
    )?.step;
    return (
      currentSpeedStep && stepCmp(currentSpeedStep, this.#current.step) === 0
    );
  }
  get signatureChangeHere() {
    const currentSignatureStep = this.#freeze.signature.at(
      this.#current.signatureIndex
    )?.step;
    return (
      currentSignatureStep &&
      stepCmp(currentSignatureStep, this.#current.step) === 0
    );
  }
  changeBpm(bpm: number | null, speed: number | null, interp: boolean) {
    let newLevel = this.#luaEditData();
    if (bpm !== null) {
      newLevel =
        luaUpdateBpmChange(newLevel, this.#current.bpmIndex, bpm) ?? newLevel;
    }
    if (speed !== null) {
      newLevel =
        luaUpdateSpeedChange(
          newLevel,
          this.#current.speedIndex,
          speed,
          interp
        ) ?? newLevel;
    }
    this.updateFreeze(newLevel);
    this.updateLua(newLevel.lua);
  }
  changeSignature(s: Signature) {
    let newLevel = this.#luaEditData();
    newLevel =
      luaUpdateBeatChange(newLevel, this.#current.signatureIndex, s) ??
      newLevel;
    this.updateFreeze(newLevel);
    this.updateLua(newLevel.lua);
  }
  toggleBpmChangeHere(bpm: boolean | null, speed: boolean | null) {
    let newLevel = this.#luaEditData();
    if (bpm !== null) {
      if (bpm && !this.bpmChangeHere) {
        newLevel =
          luaAddBpmChange(newLevel, {
            step: this.#current.step,
            bpm: this.currentBpm || 120,
            timeSec: this.#current.timeSec,
          }) ?? newLevel;
      } else if (!bpm && this.bpmChangeHere) {
        newLevel =
          luaDeleteBpmChange(newLevel, this.#current.bpmIndex) ?? newLevel;
      }
    }
    if (speed !== null) {
      if (speed && !this.speedChangeHere) {
        newLevel =
          luaAddSpeedChange(newLevel, {
            step: this.#current.step,
            bpm: this.currentBpm || 120,
            timeSec: this.#current.timeSec,
          }) ?? newLevel;
      } else if (!speed && this.speedChangeHere) {
        newLevel =
          luaDeleteSpeedChange(newLevel, this.#current.speedIndex) ?? newLevel;
      }
    }
    this.updateFreeze(newLevel);
    this.updateLua(newLevel.lua);
  }
  toggleSignatureChangeHere() {
    if (stepCmp(this.#current.step, stepZero()) > 0 && this.currentSignature) {
      let newLevel = this.#luaEditData();
      if (this.signatureChangeHere) {
        newLevel =
          luaDeleteBeatChange(newLevel, this.#current.signatureIndex) ??
          newLevel;
      } else {
        newLevel =
          luaAddBeatChange(newLevel, {
            step: this.#current.step,
            offset: this.#current.signatureState.offset,
            bars: this.currentSignature.bars,
            barNum: 0,
          }) ?? newLevel;
      }
      this.updateFreeze(newLevel);
      this.updateLua(newLevel.lua);
    }
  }

  get canAddNote() {
    return (
      this.#current.notesCountInStep === undefined ||
      !(
        (this.#meta.type === "Single" && this.#current.notesCountInStep >= 1) ||
        (this.#meta.type === "Double" && this.#current.notesCountInStep >= 2)
      )
    );
  }
  addNote(n: NoteCommand) {
    let newLevel: LevelForLuaEditLatest | null = this.#luaEditData();
    newLevel = luaAddNote(newLevel, n, this.#current.step);
    if (newLevel !== null) {
      // 追加したnoteは同じ時刻の音符の中でも最後
      this.updateFreeze(newLevel);
      this.#current.setNoteIndex(this.#current.notesIndexEnd! - 1);
    }
  }
  deleteNote() {
    if (this.#current.noteIndex !== undefined) {
      let newLevel: LevelForLuaEditLatest | null = this.#luaEditData();
      newLevel = luaDeleteNote(newLevel, this.#current.noteIndex);
      if (newLevel !== null) {
        this.updateFreeze(newLevel);
      }
    }
  }
  updateNote(n: NoteCommand) {
    if (this.#current.noteIndex !== undefined) {
      let newLevel: LevelForLuaEditLatest | null = this.#luaEditData();
      newLevel = luaUpdateNote(newLevel, this.#current.noteIndex, n);
      if (newLevel !== null) {
        this.updateFreeze(newLevel);
      }
    }
  }
}
