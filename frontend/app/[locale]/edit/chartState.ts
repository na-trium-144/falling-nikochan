import {
  getPasswd,
  preferSavePasswd,
  setPasswd,
  unsetPasswd,
} from "@/common/passwdCache";
import {
  Chart5,
  Chart6,
  Chart7,
  Chart8Edit,
  Chart9Edit,
  ChartEdit,
  currentChartVer,
  findBpmIndexFromStep,
  findInsertLine,
  getSignatureState,
  getStep,
  getTimeSec,
  LevelEdit,
  LevelForLuaEdit,
  LevelForLuaEditLatest,
  LevelFreeze,
  LevelMin,
  LevelPlay,
  levelTypesConst,
  loadChart,
  luaAddBeatChange,
  luaAddBpmChange,
  luaAddNote,
  luaAddSpeedChange,
  luaDeleteBeatChange,
  luaDeleteBpmChange,
  luaDeleteNote,
  luaDeleteSpeedChange,
  luaUpdateBeatChange,
  luaUpdateBpmChange,
  luaUpdateNote,
  luaUpdateSpeedChange,
  Note,
  NoteCommand,
  NoteCommand9,
  numEvents,
  Signature,
  SignatureState,
  Step,
  stepAdd,
  stepCmp,
  stepZero,
  validateChart,
} from "@falling-nikochan/chart";
import { useCallback, useEffect, useRef, useState } from "react";
import msgpack from "@ygoe/msgpack";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import EventEmitter from "eventemitter3";
import { useLuaExecutor } from "./luaTab";

// new時
// setGuidePage(1);

const eventTypes = [
  "changeAny", // 再render用
  "changeAnyData", // toObject()で出力するデータに変化があるとき (session管理 & hasChange で使う)
] as const;
type EventType = (typeof eventTypes)[number];
export class ChartEditing extends EventEmitter<EventType> {
  #offset: number;
  #published: boolean;
  #meta: {
    ytId: string;
    title: string;
    composer: string;
    chartCreator: string;
  };
  #levels: LevelEditing[];
  #currentLevelIndex: number | undefined; // 範囲外にはせず、levelsが空の場合undefined
  #copyBuffer: (NoteCommand | null)[];
  readonly #locale: string;

  constructor(obj: ChartEdit, locale: string) {
    super();
    this.#locale = locale;
    this.#offset = obj.offset;
    this.#published = obj.published;
    this.#meta = {
      ytId: obj.ytId,
      title: obj.title,
      composer: obj.composer,
      chartCreator: obj.chartCreator,
    };
    this.#levels = obj.levels.map(
      (l) => new LevelEditing(l, () => this.#offset)
    );
    for (const level of this.#levels) {
      for (const type of eventTypes) {
        level.on(type, () => this.emit(type));
      }
    }
    this.#copyBuffer = obj.copyBuffer;
    this.#currentLevelIndex = this.#levels.length >= 1 ? 0 : undefined;
  }
  toObject(): ChartEdit {
    return {
      falling: "nikochan",
      ver: currentChartVer,
      offset: this.#offset,
      locale: this.#locale,
      changePasswd: null,
      published: this.#published,
      ...this.#meta,
      levels: this.#levels.map((l) => l.toObject()),
      copyBuffer: this.#copyBuffer,
    };
  }

  get meta() {
    return { ...this.#meta } as const;
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
  get offset() {
    return this.#offset;
  }
  setOffset(ofs: number) {
    this.#offset = ofs;
    this.emit("changeAny");
    this.emit("changeAnyData");
  }

  copyNote(copyIndex: number) {
    if (this.currentLevel?.current.noteIndex !== undefined) {
      this.#copyBuffer[copyIndex] =
        this.currentLevel.freeze.notes[this.currentLevel.current.noteIndex];
      this.emit("changeAny");
    }
  }
  pasteNote(copyIndex: number, forceAdd: boolean = false) {
    if (this.#copyBuffer[copyIndex] && this.currentLevel) {
      if (this.currentLevel.current.noteIndex !== undefined && !forceAdd) {
        this.currentLevel.updateNote(this.#copyBuffer[copyIndex]);
      } else {
        this.currentLevel.addNote(this.#copyBuffer[copyIndex]);
      }
    }
  }
}
export class LevelEditing extends EventEmitter<EventType> {
  // これは親のChartEditingと同期
  #offset: () => number;
  // 以下の編集には updateMeta(), updateFreeze(), updateLua() を使う
  #meta: Omit<LevelMin, "lua">;
  #lua: string[];
  #freeze: LevelFreeze;

  constructor(level: LevelEdit, offset: () => number) {
    super();
    this.#offset = offset;
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
    this.#notes = [];
    this.#lengthSec = 0;
    this.#ytDuration = 0;
    this.#barLines = [];
    this.#current = new CursorState();

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
    this.emit("changeAny");
    this.emit("changeAnyData");
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
    this.#resetNotes();
    this.#resetLengthSec();
    this.emit("changeAny");
    this.emit("changeAnyData");
  }
  async updateLua(
    luaExecutor: ReturnType<typeof useLuaExecutor>,
    lua: string[]
  ) {
    luaExecutor.abortExec();
    const levelFreezed = await luaExecutor.exec(lua.join("\n"));
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

  #notes: Note[];
  #resetNotes() {
    this.#notes = loadChart({
      ver: currentChartVer,
      offset: this.#offset(),
      ...this.#freeze,
      ...this.#meta,
    } satisfies LevelPlay).notes;
  }
  get notes() {
    return [...this.#notes] as const;
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
    this.emit("changeAny");
  }
  get lengthSec() {
    return this.#lengthSec;
  }
  #ytDuration: number;
  setYTDuration(duration: number) {
    this.#ytDuration = duration;
    // これはgetterがなく直接的には何にも影響を与えないのでイベントをemitする必要はない
    this.resetYTEnd();
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
        const line = findInsertLine(this.#luaEditData(), step, false).luaLine;
        if (line !== null) {
          barLines.push({ barNum: ss.barNum + 1, luaLine: line });
        }
      }
      step = stepAdd(step, { fourth: 0, numerator: 1, denominator: 4 });
    }
    this.#barLines = barLines;
    this.emit("changeAny");
  }
  get barLines() {
    return [...this.#barLines] as const;
  }

  #current: CursorState;
  setCurrentTime(timeSec: number, snapDivider: number) {
    if (
      this.#current.timeSec != timeSec ||
      this.#current.snapDivider != snapDivider
    ) {
      this.#current.reset(timeSec, snapDivider, this.#freeze, this.#lua);
    }
  }
  selectNextNote() {
    if (this.#current.noteIndex !== undefined) {
      this.#current.setNoteIndex(this.#current.noteIndex + 1);
    }
  }
  selectPrevNote() {
    if (this.#current.noteIndex !== undefined) {
      this.#current.setNoteIndex(this.#current.noteIndex - 1);
    }
  }
  get current() {
    return this.#current;
  }

  get currentBpm() {
    return this.#freeze.bpmChanges.at(this.#current.bpmIndex)?.bpm ?? 120;
  }
  get currentSpeed() {
    return this.#freeze.speedChanges.at(this.#current.speedIndex)?.bpm ?? 120;
  }
  get currentSpeedInterp() {
    return this.#freeze.speedChanges.at(this.#current.speedIndex)?.interp;
  }
  get currentSignature() {
    return this.#freeze.signature.at(this.#current.signatureIndex);
  }
  get prevSignature() {
    return this.#current.signatureIndex > 0
      ? this.#freeze.signature.at(this.#current.signatureIndex - 1)
      : undefined;
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
            bpm: this.currentBpm,
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
            bpm: this.currentBpm,
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

  addNote(n: NoteCommand | null | undefined) {
    if (n) {
      let newLevel: LevelForLuaEditLatest | null = this.#luaEditData();
      newLevel = luaAddNote(newLevel, n, this.#current.step);
      if (newLevel !== null) {
        // 追加したnoteは同じ時刻の音符の中でも最後
        this.updateFreeze(newLevel);
        this.#current.setNoteIndex(this.#current.notesIndexEnd! - 1);
      }
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
export class CursorState extends EventEmitter<EventType> {
  // 現在のカーソル位置と、それに応じて変わる情報
  #timeSec: number = 0;
  #snapDivider: number = 1;
  #step: Step = stepZero();
  #noteIndex: number | undefined;
  #line: number | null = null;
  #signatureState: SignatureState = null!;
  #notesIndexBegin: number | undefined;
  #notesIndexEnd: number | undefined;
  #bpmIndex: number = 0;
  #speedIndex: number = 0;
  #signatureIndex: number = 0;
  reset(
    timeSec: number,
    snapDivider: number,
    freeze: LevelFreeze,
    lua: string[]
  ) {
    this.#snapDivider = snapDivider;
    const step = getStep(freeze.bpmChanges, timeSec, snapDivider);
    this.#step = step;

    this.#notesIndexBegin = freeze.notes.findIndex(
      (n) => stepCmp(n.step, step) == 0
    );
    this.#notesIndexEnd =
      freeze.notes.findLastIndex((n) => stepCmp(n.step, step) == 0) + 1;
    if (this.#notesIndexBegin === -1) {
      this.#notesIndexBegin = undefined;
      this.#notesIndexEnd = undefined;
    }
    if (timeSec < this.#timeSec) {
      this.#noteIndex = this.#notesIndexEnd;
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

    this.emit("changeAny");
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
      this.emit("changeAny");
    }
  }
  get timeSec() {
    return this.#timeSec;
  }
  get snapDivider() {
    return this.#snapDivider;
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

interface Props {
  onLoad: (cid: string) => void;
  locale: string;
}
// chartとパスワードの管理まではこのフックの範囲
export function useChartState(props: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_rerenderIndex, setRerenderIndex] = useState<number>(0);
  const rerender = useCallback(() => setRerenderIndex((i) => i + 1), []);

  const chartRef = useRef<ChartEditing | undefined>(undefined);
  useEffect(() => {
    chartRef.current?.on("changeAny", rerender);
    return () => {
      chartRef.current?.off("changeAny", rerender);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRef.current, rerender]);

  const [convertedFrom, setConvertedFrom] = useState<number>(currentChartVer);

  // const [hasChange, setHasChange] = useState<boolean>(false);

  // 新規譜面はundefined 保存で変わる
  const [cid, setCid] = useState<string | undefined>(undefined);

  // fetchに成功したらセット、
  // 以降保存のたびにこれを使ってpostし、新しいパスワードでこれを上書き
  const currentPasswd = useRef<string | null>(null);

  // パスワードを保存するかどうか
  // これは譜面読み込み後もmetaタブのチェックボックスに引き継がれる
  const [savePasswd, setSavePasswd] = useState<boolean>(false);
  useEffect(() => {
    setSavePasswd(preferSavePasswd());
  }, []);

  const [loadStatus, setLoadStatus] = useState<
    | "undefined"
    | "loading"
    | "passwdFailed"
    | { status?: number; msg: string }
    | "ok"
  >("undefined");
  const [isNewChart, setIsNewChart] = useState<boolean>(false);

  const t = useTranslations("edit");
  const te = useTranslations("error");
  const router = useRouter();

  const { onLoad, locale } = props;

  const fetchChart = useCallback(
    async (
      cid: string,
      isFirst: boolean,
      bypass: boolean,
      editPasswd: string,
      savePasswd: boolean
    ) => {
      setLoadStatus("loading");

      const q = new URLSearchParams();
      if (getPasswd(cid)) {
        q.set("ph", getPasswd(cid)!);
      }
      if (editPasswd) {
        currentPasswd.current = editPasswd;
        q.set("p", currentPasswd.current);
      } else {
        currentPasswd.current = null;
      }
      if (bypass) {
        q.set("pbypass", "1");
      }
      let res: Response | null = null;
      try {
        res = await fetch(
          process.env.BACKEND_PREFIX + `/api/chartFile/${cid}?` + q.toString(),
          {
            cache: "no-store",
            credentials:
              process.env.NODE_ENV === "development"
                ? "include"
                : "same-origin",
          }
        );
        if (res?.ok) {
          try {
            const chartRes: Chart5 | Chart6 | Chart7 | Chart8Edit | Chart9Edit =
              msgpack.deserialize(await res.arrayBuffer());
            const chart: ChartEdit = await validateChart(chartRes);
            if (savePasswd) {
              if (currentPasswd.current) {
                try {
                  const res = await fetch(
                    process.env.BACKEND_PREFIX +
                      `/api/hashPasswd/${cid}?p=${currentPasswd.current}`,
                    {
                      credentials:
                        process.env.NODE_ENV === "development"
                          ? "include"
                          : "same-origin",
                    }
                  );
                  setPasswd(cid, await res.text());
                } catch {
                  //ignore
                }
              }
            } else {
              unsetPasswd(cid);
            }
            setConvertedFrom(chartRes.ver);
            chartRef.current = chart;
            setLoadStatus("ok");
            onLoad(cid);
          } catch (e) {
            console.error(e);
            setLoadStatus({ msg: te("badResponse") });
          }
        } else {
          if (res?.status === 401) {
            if (!isFirst) {
              setLoadStatus("passwdFailed");
            }
          } else {
            try {
              const message = ((await res?.json()) as { message?: string })
                .message;
              if (te.has("api." + message)) {
                setLoadStatus({
                  status: res?.status,
                  msg: te("api." + message),
                });
              } else {
                setLoadStatus({
                  status: res?.status,
                  msg: message || te("unknownApiError"),
                });
              }
            } catch {
              setLoadStatus({
                status: res?.status,
                msg: te("unknownApiError"),
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
        chartRef.current = undefined;
        setLoadStatus({ msg: te("api.fetchError") });
      }
    },
    [te]
  );

  useEffect(() => {
    if (loadStatus === "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get("cid");
      if (sessionStorage.getItem("editSession")) {
        const data = JSON.parse(sessionStorage.getItem("editSession")!);
        sessionStorage.removeItem("editSession");
        if (data.cid === cid || (data.cid === undefined && cid === "new")) {
          setCid(data.cid);
          currentPasswd.current = data.currentPasswd.current;
          setSavePasswd(data.savePasswd);
          chartRef.current = data.chart;
          setConvertedFrom(data.convertedFrom);
          setCurrentLevelIndex(data.currentLevelIndex);
          setHasChange(data.hasChange);
          setLoadStatus("ok");
          // onLoad();
          return;
        }
      }
      if (cid === "new") {
        setIsNewChart(true);
        setCid(undefined);
        setLoadStatus("ok");
        onLoad("new");
        chartRef.current = emptyChart(locale);
      } else if (cid) {
        setCid(cid);
        void fetchChart(cid, true, false, "", true);
      } else {
        router.push(`/${locale}/main/edit`);
      }
    }
  }, [fetchChart, t, locale, router, loadStatus]);

  // PWAでテストプレイを押した場合に編集中の譜面データをsessionStorageに退避
  const saveEditSession = useCallback(() => {
    sessionStorage.setItem(
      "editSession",
      JSON.stringify({
        cid,
        currentPasswd,
        savePasswd,
        chart: chartRef.current,
        convertedFrom,
        currentLevelIndex,
        hasChange,
      })
    );
  }, [
    cid,
    currentPasswd,
    savePasswd,
    convertedFrom,
    currentLevelIndex,
    hasChange,
  ]);

  return {
    chart: chartRef.current,
    convertedFrom,
    currentLevelIndex,
    setCurrentLevelIndex,
    cid,
    currentPasswd,
    savePasswd,
    setSavePasswd,
    loadStatus,
    isNewChart,
    fetchChart,
    saveEditSession,
  };
}
