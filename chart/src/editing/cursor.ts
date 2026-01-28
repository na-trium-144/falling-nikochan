import { EventEmitter } from "eventemitter3";
import { EventType, eventTypes } from "./types.js";
import { Step, stepCmp, stepZero } from "../step.js";
import {
  findBpmIndexFromStep,
  getSignatureState,
  getStep,
  SignatureState,
} from "../seq.js";
import { LevelFreeze } from "../chart.js";
import { findInsertLine } from "../lua/edit.js";

export class CursorState extends EventEmitter<EventType> {
  // 現在のカーソル位置と、それに応じて変わる情報
  // timeSecはoffsetを引いたあとの時刻
  #timeSec: number = 0;
  #step: Step = stepZero();
  #noteIndex: number | undefined;
  #line: number | null = null;
  #signatureState: SignatureState = null!;
  #notesIndexBegin: number | undefined;
  #notesIndexEnd: number | undefined;
  #bpmIndex: number = 0;
  #speedIndex: number = 0;
  #signatureIndex: number = 0;
  constructor(
    timeSec: number,
    freeze: LevelFreeze,
    lua: string[],
    parentEmit: (type: EventType) => void
  ) {
    super();
    for (const type of eventTypes) {
      this.on(type, () => parentEmit(type));
    }
    this.reset(timeSec, 1, freeze, lua);
  }
  reset(
    timeSec: number,
    snapDivider: number,
    freeze: LevelFreeze,
    lua: string[]
  ) {
    // this.#snapDivider = snapDivider;
    const step = getStep(freeze.bpmChanges, timeSec, snapDivider);
    this.#step = step;

    this.#notesIndexBegin = freeze.notes.findIndex(
      (n) => stepCmp(n.step, step) === 0
    );
    this.#notesIndexEnd =
      freeze.notes.findLastIndex((n) => stepCmp(n.step, step) === 0) + 1;
    if (this.#notesIndexBegin === -1) {
      this.#notesIndexBegin = undefined;
      this.#notesIndexEnd = undefined;
    }
    if (timeSec < this.#timeSec) {
      this.#noteIndex =
        this.#notesIndexEnd !== undefined ? this.#notesIndexEnd - 1 : undefined;
    } else {
      this.#noteIndex = this.#notesIndexBegin;
    }

    this.#timeSec = timeSec;

    if (this.#noteIndex !== undefined) {
      this.#line = freeze.notes[this.#noteIndex].luaLine;
    } else {
      this.#line = findInsertLine({ ...freeze, lua }, step, false).luaLine;
    }

    this.#signatureState = getSignatureState(freeze.signature, step);
    this.#bpmIndex = findBpmIndexFromStep(freeze.bpmChanges, step);
    this.#speedIndex = findBpmIndexFromStep(freeze.speedChanges, step);
    this.#signatureIndex = findBpmIndexFromStep(freeze.signature, step);

    this.emit("rerender");
  }
  setNoteIndex(index: number | undefined) {
    if (
      index !== undefined &&
      this.#notesIndexBegin !== undefined &&
      this.#notesIndexEnd !== undefined &&
      index >= this.#notesIndexBegin &&
      index < this.#notesIndexEnd
    ) {
      this.#noteIndex = index;
      this.emit("rerender");
    }
  }
  get timeSec() {
    return this.#timeSec;
  }
  get step() {
    return this.#step;
  }
  get noteIndex() {
    return this.#noteIndex;
  }
  get line() {
    return this.#line;
  }
  get signatureState() {
    return this.#signatureState;
  }
  get currentStepStr() {
    return (
      this.signatureState.barNum +
      1 +
      ";" +
      (this.signatureState.count.fourth + 1) +
      (this.signatureState.count.numerator > 0
        ? "+" +
          this.signatureState.count.numerator +
          "/" +
          this.signatureState.count.denominator * 4
        : "")
    );
  }
  get notesIndexBegin() {
    return this.#notesIndexBegin;
  }
  get notesIndexEnd() {
    return this.#notesIndexEnd;
  }
  get notesCountInStep() {
    if (
      this.#notesIndexEnd !== undefined &&
      this.#notesIndexBegin !== undefined
    ) {
      return this.#notesIndexEnd - this.#notesIndexBegin;
    } else {
      return 0;
    }
  }
  get notesIndexInStep() {
    return this.#noteIndex !== undefined && this.#notesIndexBegin !== undefined
      ? this.#noteIndex - this.#notesIndexBegin
      : undefined;
  }
  get bpmIndex() {
    return this.#bpmIndex;
  }
  get speedIndex() {
    return this.#speedIndex;
  }
  get signatureIndex() {
    return this.#signatureIndex;
  }
}
