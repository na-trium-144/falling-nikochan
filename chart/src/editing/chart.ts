import { EventEmitter } from "eventemitter3";
import { EventType, LuaExecutorRef } from "./types.js";
import { LevelEditing } from "./level.js";
import { NoteCommand } from "../command.js";
import {
  ChartEdit,
  ChartMin,
  currentChartVer,
  LevelEdit,
  numEvents,
} from "../chart.js";

export class ChartEditing extends EventEmitter<EventType> {
  #offset: number;
  #luaExecutorRef: LuaExecutorRef;
  #meta: {
    published: boolean;
    ytId: string;
    title: string;
    composer: string;
    chartCreator: string;
  };
  #levels: LevelEditing[];
  #currentLevelIndex: number | undefined; // 範囲外にはせず、levelsが空の場合undefined
  #copyBuffer: (NoteCommand | null)[];
  readonly #locale: string;
  #convertedFrom: number;
  #hasChange: boolean;
  #numEvents: number;
  // 新規譜面はundefined 保存で変わる
  #cid: string | undefined;
  // fetchに成功したらセット、
  // 以降保存のたびにこれを使ってpostし、新しいパスワードでこれを上書き
  #currentPasswd: string | null;
  // 新しいパスワード
  #changePasswd: string | null;

  constructor(
    obj: ChartEdit,
    options: {
      luaExecutorRef: LuaExecutorRef;
      locale: string;
      cid: string | undefined;
      currentPasswd: string | null;
      convertedFrom?: number;
      currentLevelIndex?: number;
      hasChange?: boolean;
    }
  ) {
    super();
    this.#luaExecutorRef = options.luaExecutorRef;

    this.#locale = options.locale;
    this.#convertedFrom = options.convertedFrom ?? obj.ver;
    this.#cid = options.cid;
    this.#currentPasswd = options.currentPasswd;
    this.#changePasswd = null;

    this.#hasChange = options.hasChange ?? false;
    this.#numEvents = numEvents(this.toObject());
    this.on("change", () => {
      this.#hasChange = true;
      this.#numEvents = numEvents(this.toObject());
    });

    this.#offset = obj.offset;
    this.#meta = {
      published: obj.published,
      ytId: obj.ytId,
      title: obj.title,
      composer: obj.composer,
      chartCreator: obj.chartCreator,
    };
    this.#levels = obj.levels.map(
      (l) =>
        new LevelEditing(
          l,
          (type) => this.emit(type),
          () => this.#offset,
          this.#luaExecutorRef
        )
    );
    this.#copyBuffer = obj.copyBuffer;
    this.#currentLevelIndex =
      (options.currentLevelIndex ?? this.#levels.length >= 1) ? 0 : undefined;
  }
  resetOnSave(cid: string) {
    this.#convertedFrom = currentChartVer;
    this.#hasChange = false;
    if (this.#changePasswd) {
      this.#currentPasswd = this.changePasswd;
    }
    this.#changePasswd = null;
    this.#cid = cid;
    this.emit("rerender");
  }
  toObject(): ChartEdit {
    return {
      falling: "nikochan",
      ver: currentChartVer,
      offset: this.#offset,
      locale: this.#locale,
      ...this.#meta,
      levels: this.#levels.map((l) => l.toObject()),
      copyBuffer: this.#copyBuffer,
      changePasswd: this.#changePasswd,
    };
  }
  toMin(): ChartMin {
    return {
      falling: "nikochan",
      ver: currentChartVer,
      offset: this.#offset,
      locale: this.#locale,
      ...this.#meta,
      levels: this.#levels.map((l) => ({
        name: l.meta.name,
        type: l.meta.type,
        unlisted: l.meta.unlisted,
        lua: [...l.lua],
        ytBegin: l.meta.ytBegin,
        ytEnd: l.meta.ytEnd,
        ytEndSec: l.meta.ytEndSec,
      })),
      copyBuffer: this.#copyBuffer,
    };
  }

  get meta() {
    return { ...this.#meta } as const;
  }
  get numEvents() {
    return this.#numEvents;
  }
  get levels() {
    return [...this.#levels] as const;
  }
  get currentLevel() {
    if (this.#currentLevelIndex !== undefined) {
      return this.#levels[this.#currentLevelIndex];
    } else {
      return undefined;
    }
  }
  addLevel(level: LevelEdit) {
    this.#levels.push(
      new LevelEditing(
        level,
        (type) => this.emit(type),
        () => this.#offset,
        this.#luaExecutorRef
      )
    );
    this.#currentLevelIndex = this.#levels.length - 1;
    this.emit("rerender");
    this.emit("change");
  }
  deleteLevel() {
    if (this.#currentLevelIndex !== undefined && this.#levels.length > 0) {
      this.#levels.splice(this.#currentLevelIndex, 1);
      if (this.#levels.length === 0) {
        this.#currentLevelIndex = undefined;
      } else if (this.#currentLevelIndex >= this.#levels.length) {
        this.#currentLevelIndex = this.#levels.length - 1;
      }
      this.emit("rerender");
      this.emit("change");
    }
  }
  moveLevelUp() {
    if (this.#currentLevelIndex !== undefined && this.#currentLevelIndex > 0) {
      const idx = this.#currentLevelIndex;
      const tmp = this.#levels[idx];
      this.#levels[idx] = this.#levels[idx - 1];
      this.#levels[idx - 1] = tmp;
      this.#currentLevelIndex = idx - 1;
      this.emit("rerender");
      this.emit("change");
    }
  }
  moveLevelDown() {
    if (
      this.#currentLevelIndex !== undefined &&
      this.#currentLevelIndex < this.#levels.length - 1
    ) {
      const idx = this.#currentLevelIndex;
      const tmp = this.#levels[idx];
      this.#levels[idx] = this.#levels[idx + 1];
      this.#levels[idx + 1] = tmp;
      this.#currentLevelIndex = idx + 1;
      this.emit("rerender");
      this.emit("change");
    }
  }
  get currentLevelIndex() {
    return this.#currentLevelIndex;
  }
  setCurrentLevelIndex(index: number) {
    if (index >= 0 && index < this.#levels.length) {
      this.#currentLevelIndex = index;
      this.emit("rerender");
    }
  }
  get offset() {
    return this.#offset;
  }
  get convertedFrom() {
    return this.#convertedFrom;
  }
  get hasChange() {
    return this.#hasChange;
    // constructorで"change"イベント時にtrueになるようコールバックを設定している
  }
  get cid() {
    return this.#cid;
  }
  get currentPasswd() {
    return this.#currentPasswd;
  }
  get changePasswd() {
    return this.#changePasswd;
  }
  setChangePasswd(pw: string | null) {
    if (!pw) {
      pw = null;
    }
    this.#changePasswd = pw;
    this.emit("rerender");
    this.emit("change");
  }

  setOffset(ofs: number) {
    const oldOffset = this.#offset;
    this.#offset = ofs;
    for (const level of this.#levels) {
      level.setCurrentTimeWithoutOffset(level.current.timeSec + oldOffset);
    }
    this.emit("rerender");
    this.emit("change");
  }
  setCurrentTimeWithoutOffset(
    timeSecWithoutOffset: number,
    snapDivider?: number
  ) {
    for (const level of this.#levels) {
      level.setCurrentTimeWithoutOffset(timeSecWithoutOffset, snapDivider);
    }
  }
  setYTDuration(duration: number) {
    for (const level of this.#levels) {
      level.setYTDuration(duration);
    }
  }

  copyNote(copyIndex: number) {
    if (this.currentLevel?.currentNote) {
      this.#copyBuffer[copyIndex] = this.currentLevel.currentNote!;
      this.emit("rerender");
      // dataに変化があるが、changeは呼ばない
    }
  }
  pasteNote(copyIndex: number, forceAdd: boolean = false) {
    if (this.#copyBuffer.at(copyIndex) && this.currentLevel) {
      if (this.currentLevel?.currentNote && !forceAdd) {
        this.currentLevel.updateNote(this.#copyBuffer.at(copyIndex)!);
      } else {
        this.currentLevel.addNote(this.#copyBuffer.at(copyIndex)!);
      }
    }
  }
  hasCopyBuf(copyIndex: number) {
    return !!this.#copyBuffer.at(copyIndex);
  }

  updateMeta(
    newMeta: Partial<{
      published: boolean;
      ytId: string;
      title: string;
      composer: string;
      chartCreator: string;
    }>
  ) {
    this.#meta = { ...this.#meta, ...newMeta };
    this.emit("rerender");
    this.emit("change");
  }
}
