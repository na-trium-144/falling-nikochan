"use client";

import {
  defaultNoteCommand,
  NoteCommand,
  Signature,
} from "@/chartFormat/command";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube";
import { useCallback, useEffect, useRef, useState, use } from "react";
import FallingWindow from "./fallingWindow";
import {
  findBpmIndexFromStep,
  getSignatureState,
  getStep,
  getTimeSec,
  loadChart,
  Note,
} from "@/chartFormat/seq";
import Button from "@/common/button";
import TimeBar from "./timeBar";
import Input from "@/common/input";
import TimingTab from "./timingTab";
import NoteTab from "./noteTab";
import { Box, CenterBoxOnlyPage, Error, Loading } from "@/common/box";
import { MetaTab } from "./metaTab";
import msgpack from "@ygoe/msgpack";
import { addRecent } from "@/common/recent";
import {
  Chart,
  createBrief,
  emptyChart,
  hashLevel,
  hashPasswd,
  Level,
  levelBgColors,
  levelTypes,
} from "@/chartFormat/chart";
import { Step, stepAdd, stepCmp, stepZero } from "@/chartFormat/step";
import Header from "@/common/header";
import { getPasswd, setPasswd } from "@/common/passwdCache";
import LuaTab from "./luaTab";
import {
  luaAddBpmChange,
  luaDeleteBpmChange,
  luaUpdateBpmChange,
} from "@/chartFormat/lua/bpm";
import {
  luaAddSpeedChange,
  luaDeleteSpeedChange,
  luaUpdateSpeedChange,
} from "@/chartFormat/lua/speed";
import {
  luaAddNote,
  luaDeleteNote,
  luaUpdateNote,
} from "@/chartFormat/lua/note";
import Select from "@/common/select";
import LevelTab from "./levelTab";
import { initSession, SessionData } from "@/play/session";
import { GuideMain } from "../guide/guideMain";
import {
  luaAddBeatChange,
  luaDeleteBeatChange,
  luaUpdateBeatChange,
} from "@/chartFormat/lua/signature";
import { Params } from "next/dist/server/request/params";
import { useDisplayMode } from "@/scale";
import { Forbid, Move } from "@icon-park/react";
import { linkStyle1 } from "@/common/linkStyle";
import { useTheme } from "@/common/theme";

export default function Page(context: { params: Promise<Params> }) {
  const params = use(context.params);
  // cid が "new" の場合空のchartで編集をはじめて、post時にcidが振られる
  const cidInitial = useRef<string>(String(params.cid));
  const [cid, setCid] = useState<string | undefined>(String(params.cid));
  const { isTouch } = useDisplayMode();
  const themeContext = useTheme();

  // chartのgetやpostに必要なパスワード
  // post時には前のchartのパスワードを入力し、その後は新しいパスワードを使う
  const [editPasswd, setEditPasswd] = useState<string>("");
  const [passwdFailed, setPasswdFailed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [chart, setChart] = useState<Chart>();
  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMsg, setErrorMsg] = useState<string>();

  const fetchChart = useCallback(async (isFirst: boolean) => {
    if (cidInitial.current === "new") {
      setChart(emptyChart());
      setPasswdFailed(false);
      setLoading(false);
      setCid(undefined);
      setGuidePage(1);
    } else {
      setPasswdFailed(false);
      setLoading(true);
      const res = await fetch(
        `/api/chartFile/${cidInitial.current}?p=${getPasswd(
          cidInitial.current
        )}`,
        { cache: "no-store" }
      );
      setLoading(false);
      if (res.ok) {
        try {
          const chart = msgpack.deserialize(await res.arrayBuffer());
          // validateはサーバー側でやってる
          setPasswd(cidInitial.current, await hashPasswd(chart.editPasswd));
          setChart(chart);
          setErrorStatus(undefined);
          setErrorMsg(undefined);
          addRecent("edit", cidInitial.current);
        } catch (e) {
          setChart(undefined);
          setErrorStatus(undefined);
          setErrorMsg("invalid response");
        }
      } else {
        if (res.status === 401) {
          if (!isFirst) {
            setPasswdFailed(true);
          }
          setChart(undefined);
        } else {
          setChart(undefined);
          setErrorStatus(res.status);
          try {
            setErrorMsg(String((await res.json()).message));
          } catch (e) {
            setErrorMsg("");
          }
        }
      }
    }
  }, []);
  useEffect(() => void fetchChart(true), [fetchChart]);

  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const currentLevel = chart?.levels.at(currentLevelIndex);

  const [hasChange, setHasChange] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<number>();
  const [sessionData, setSessionData] = useState<SessionData>();
  const [fileSize, setFileSize] = useState<number>(0);

  const changeChart = (chart: Chart) => {
    void (async () => {
      for (const level of chart.levels) {
        level.hash = await hashLevel(level);
      }
      setHasChange(true);
      setChart(chart);
    })();
  };
  useEffect(() => {
    if (chart) {
      if (sessionId === undefined) {
        setSessionId(initSession(null));
      }
      const data = {
        cid: cid,
        lvIndex: currentLevelIndex,
        brief: createBrief(chart),
        chart: chart,
        editing: true,
      };
      setFileSize(msgpack.serialize(chart).byteLength);
      setSessionData(data);
      initSession(data, sessionId);
      // 譜面の編集時に毎回sessionに書き込む (テストプレイタブのリロードだけで読めるように)
      // 念の為metaTabでテストプレイボタンが押された時にも書き込んでいる
    }
  }, [sessionId, chart, currentLevelIndex, cid]);

  const changeLevel = (newLevel: Level | null) => {
    if (chart && newLevel) {
      const newChart: Chart = { ...chart };
      newChart.levels[currentLevelIndex] = newLevel;
      changeChart(newChart);
    }
  };

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (hasChange) {
        const confirmationMessage = "未保存の変更があります";

        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [hasChange, sessionId]);

  const ref = useRef<HTMLDivElement>(null!);

  // 現在時刻 offsetを引く前
  // setはytPlayerから取得。変更するにはchangeCurrentTimeSecを呼ぶ
  const [currentTimeSecWithoutOffset, setCurrentTimeSecWithoutOffset] =
    useState<number>(0);
  // 現在時刻に対応するstep
  const [currentStep, setCurrentStep] = useState<Step>(stepZero());
  // snapの刻み幅 を1stepの4n分の1にする
  const [snapDivider, setSnapDivider] = useState<number>(4);
  const [timeBarPxPerSec, setTimeBarPxPerSec] = useState<number>(300);

  // offsetを引いた後の時刻
  const currentTimeSec = currentTimeSecWithoutOffset - (chart?.offset || 0);
  // 現在選択中の音符 (currentStepSnappedに一致)
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(-1);
  const hasCurrentNote =
    currentNoteIndex >= 0 &&
    currentLevel?.notes.at(currentNoteIndex) !== undefined;
  const [notesCountInStep, setNotesCountInStep] = useState<number>(0);
  const [notesIndexInStep, setNotesIndexInStep] = useState<number>(0);
  const canAddNote = !(
    (currentLevel?.type === "Single" && notesCountInStep >= 1) ||
    (currentLevel?.type === "Double" && notesCountInStep >= 2)
  );
  useEffect(() => {
    if (currentLevel) {
      let notesCountInStep = 0;
      let notesIndexInStep = 0;
      for (let i = 0; i < currentLevel.notes.length; i++) {
        const n = currentLevel.notes[i];
        if (stepCmp(currentStep, n.step) > 0) {
          continue;
        } else if (stepCmp(currentStep, n.step) == 0) {
          if (i < currentNoteIndex) {
            notesIndexInStep++;
          }
          notesCountInStep++;
        } else {
          break;
        }
      }
      setNotesCountInStep(notesCountInStep);
      setNotesIndexInStep(notesIndexInStep);
    }
  }, [currentLevel, currentStep, currentNoteIndex]);

  // currentTimeが変わったときcurrentStepを更新
  const prevTimeSec = useRef<number>(-1);
  useEffect(() => {
    if (currentLevel && currentTimeSec !== prevTimeSec.current) {
      const step = getStep(
        currentLevel.bpmChanges,
        currentTimeSec,
        snapDivider
      );
      if (stepCmp(step, currentStep) !== 0) {
        setCurrentStep(step);
      }
      if (
        !hasCurrentNote ||
        stepCmp(currentLevel.notes[currentNoteIndex].step, step) != 0
      ) {
        let noteIndex: number;
        if (currentTimeSec < prevTimeSec.current) {
          noteIndex = currentLevel.notes.findLastIndex(
            (n) => stepCmp(n.step, step) == 0
          );
        } else {
          noteIndex = currentLevel.notes.findIndex(
            (n) => stepCmp(n.step, step) == 0
          );
        }
        if (currentNoteIndex !== noteIndex) {
          setCurrentNoteIndex(noteIndex);
        }
      }
    }
    prevTimeSec.current = currentTimeSec;
  }, [
    currentLevel,
    snapDivider,
    currentTimeSec,
    currentStep,
    currentNoteIndex,
    hasCurrentNote,
  ]);

  const ytPlayer = useRef<YouTubePlayer>(undefined);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const changePlaybackRate = (rate: number) => {
    ytPlayer.current?.setPlaybackRate(rate);
  };

  // ytPlayerが再生中
  const [playing, setPlaying] = useState<boolean>(false);
  // ytPlayerが準備完了
  const [ready, setReady] = useState<boolean>(false);
  const onReady = useCallback(() => {
    console.log("ready");
    setReady(true);
  }, []);
  const onStart = useCallback(() => {
    console.log("start");
    setPlaying(true);
  }, []);
  const onStop = useCallback(() => {
    console.log("stop");
    setPlaying(false);
  }, []);
  const start = () => {
    ytPlayer.current?.playVideo();
    ref.current.focus();
  };
  const stop = () => {
    ytPlayer.current?.pauseVideo();
    ref.current.focus();
  };
  const changeCurrentTimeSec = (timeSec: number, focus = true) => {
    if (ytPlayer.current?.seekTo) {
      ytPlayer.current?.seekTo(timeSec, true);
    }
    if (focus) {
      ref.current.focus();
    }
  };
  const seekRight1 = () => {
    if (currentLevel) {
      if (
        hasCurrentNote &&
        currentLevel.notes[currentNoteIndex + 1] &&
        stepCmp(currentStep, currentLevel.notes[currentNoteIndex + 1].step) ===
          0
      ) {
        setCurrentNoteIndex(currentNoteIndex + 1);
      } else {
        seekStepRel(1);
      }
    }
    ref.current.focus();
  };
  const seekLeft1 = () => {
    if (chart) {
      if (
        hasCurrentNote &&
        currentLevel.notes[currentNoteIndex - 1] &&
        stepCmp(currentStep, currentLevel.notes[currentNoteIndex - 1].step) ===
          0
      ) {
        setCurrentNoteIndex(currentNoteIndex - 1);
      } else {
        seekStepRel(-1);
      }
    }
    ref.current.focus();
  };
  const seekStepRel = (move: number) => {
    let newStep = stepAdd(currentStep, {
      fourth: 0,
      numerator: move,
      denominator: snapDivider,
    });
    seekStepAbs(newStep);
  };
  const seekStepAbs = (newStep: Step, focus = true) => {
    if (chart && currentLevel) {
      if (stepCmp(newStep, stepZero()) < 0) {
        newStep = stepZero();
      }
      changeCurrentTimeSec(
        getTimeSec(currentLevel.bpmChanges, newStep) + chart.offset,
        focus
      );
    }
    if (focus) {
      ref.current.focus();
    }
  };
  const seekSec = (moveSec: number, focus = true) => {
    if (chart) {
      changeCurrentTimeSec(currentTimeSec + chart.offset + moveSec, focus);
    }
  };

  useEffect(() => {
    const i = setInterval(() => {
      if (ytPlayer.current?.getCurrentTime) {
        setCurrentTimeSecWithoutOffset(ytPlayer.current.getCurrentTime());
      }
    }, 50);
    return () => clearInterval(i);
  }, []);

  const [notesAll, setNotesAll] = useState<Note[]>([]);
  useEffect(() => {
    if (chart) {
      setNotesAll(loadChart(chart, currentLevelIndex).notes);
    }
  }, [chart, currentLevelIndex]);

  const [tab, setTab] = useState<number>(0);
  const [guidePage, setGuidePage] = useState<number | null>(null);
  const tabNames = ["Meta", "Timing", "Levels", "Notes", "Code"];
  const isCodeTab = tab === 4;
  const openGuide = () => setGuidePage([2, 4, 5, 6, 7][tab]);

  const [dragMode, setDragMode] = useState<null | "p" | "v" | "a">(null);
  if (dragMode === null && !isTouch) {
    setDragMode("p");
  }

  const changeOffset = (ofs: number) => {
    if (chart /*&& offsetValid(ofs)*/) {
      changeChart({ ...chart, offset: ofs });
    }
  };
  const currentBpmIndex =
    currentLevel && findBpmIndexFromStep(currentLevel.bpmChanges, currentStep);
  const currentBpm =
    currentLevel &&
    currentLevel.bpmChanges.length > 0 &&
    currentBpmIndex !== undefined
      ? currentLevel.bpmChanges[currentBpmIndex].bpm
      : 120;
  const changeBpm = (bpm: number) => {
    if (currentLevel && currentBpmIndex !== undefined) {
      if (currentLevel.bpmChanges.length === 0) {
        throw "bpmChanges empty";
        // chart.bpmChanges.push({
        //   step: stepZero(),
        //   bpm: bpm,
        //   timeSec: 0,
        // });
      } else {
        const newLevel = luaUpdateBpmChange(currentLevel, currentBpmIndex, bpm);
        changeLevel(newLevel);
      }
    }
  };
  const bpmChangeHere =
    currentLevel &&
    currentBpmIndex !== undefined &&
    currentLevel.bpmChanges.length > 0 &&
    stepCmp(currentLevel.bpmChanges[currentBpmIndex].step, currentStep) === 0;
  const toggleBpmChangeHere = () => {
    if (
      chart &&
      currentLevel &&
      currentBpmIndex !== undefined &&
      stepCmp(currentStep, stepZero()) > 0
    ) {
      if (bpmChangeHere) {
        const newLevel = luaDeleteBpmChange(currentLevel, currentBpmIndex);
        changeLevel(newLevel);
      } else {
        const newLevel = luaAddBpmChange(currentLevel, {
          step: currentStep,
          bpm: currentBpm,
          timeSec: currentTimeSec,
        });
        changeLevel(newLevel);
      }
    }
  };

  const currentSpeedIndex =
    currentLevel &&
    findBpmIndexFromStep(currentLevel.speedChanges, currentStep);
  const currentSpeed =
    currentLevel &&
    currentLevel.speedChanges.length > 0 &&
    currentSpeedIndex !== undefined
      ? currentLevel.speedChanges[currentSpeedIndex].bpm
      : 120;
  const changeSpeed = (bpm: number) => {
    if (chart && currentLevel && currentSpeedIndex !== undefined) {
      if (currentLevel.speedChanges.length === 0) {
        throw "speedChanges empty";
        // chart.speedChanges.push({
        //   step: stepZero(),
        //   bpm: bpm,
        //   timeSec: 0,
        // });
      } else {
        const newLevel = luaUpdateSpeedChange(
          currentLevel,
          currentSpeedIndex,
          bpm
        );
        changeLevel(newLevel);
      }
    }
  };
  const speedChangeHere =
    currentLevel &&
    currentSpeedIndex !== undefined &&
    currentLevel.speedChanges.length > 0 &&
    stepCmp(currentLevel.speedChanges[currentSpeedIndex].step, currentStep) ===
      0;
  const toggleSpeedChangeHere = () => {
    if (
      chart &&
      currentLevel &&
      currentSpeedIndex !== undefined &&
      stepCmp(currentStep, stepZero()) > 0
    ) {
      if (speedChangeHere) {
        const newLevel = luaDeleteSpeedChange(currentLevel, currentSpeedIndex);
        changeLevel(newLevel);
      } else {
        const newLevel = luaAddSpeedChange(currentLevel, {
          step: currentStep,
          bpm: currentSpeed,
          timeSec: currentTimeSec,
        });
        changeLevel(newLevel);
      }
    }
  };

  const currentSignatureIndex =
    currentLevel && findBpmIndexFromStep(currentLevel.signature, currentStep);
  const currentSignature = currentLevel?.signature.at(
    currentSignatureIndex || 0
  );
  const prevSignature =
    currentSignatureIndex && currentSignatureIndex > 0
      ? currentLevel?.signature.at(currentSignatureIndex - 1)
      : undefined;
  const signatureChangeHere =
    currentSignature && stepCmp(currentSignature.step, currentStep) === 0;
  const changeSignature = (s: Signature) => {
    if (chart && currentLevel && currentSignatureIndex !== undefined) {
      const newLevel = luaUpdateBeatChange(
        currentLevel,
        currentSignatureIndex,
        s
      );
      changeLevel(newLevel);
    }
  };
  const toggleSignatureChangeHere = () => {
    if (
      chart &&
      currentLevel &&
      currentSignatureIndex !== undefined &&
      currentSignature &&
      stepCmp(currentStep, stepZero()) > 0
    ) {
      if (signatureChangeHere) {
        const newLevel = luaDeleteBeatChange(
          currentLevel,
          currentSignatureIndex
        );
        changeLevel(newLevel);
      } else {
        const newLevel = luaAddBeatChange(currentLevel, {
          step: currentStep,
          offset: getSignatureState(currentLevel.signature, currentStep).offset,
          bars: currentSignature.bars,
          barNum: 0,
        });
        changeLevel(newLevel);
      }
    }
  };
  const addNote = (n: NoteCommand | null = copyBuf[0]) => {
    if (chart && currentLevel && n && canAddNote) {
      const levelCopied = { ...currentLevel };
      const newLevel = luaAddNote(levelCopied, n, currentStep);
      if (newLevel !== null) {
        // 追加したnoteは同じ時刻の音符の中でも最後
        setCurrentNoteIndex(
          currentLevel.notes.findLastIndex(
            (n) => stepCmp(n.step, currentStep) == 0
          )
        );
        changeLevel(newLevel);
      }
    }
    ref.current.focus();
  };
  const deleteNote = () => {
    if (chart && currentLevel && hasCurrentNote) {
      const levelCopied = { ...currentLevel };
      const newLevel = luaDeleteNote(levelCopied, currentNoteIndex);
      changeLevel(newLevel);
    }
    ref.current.focus();
  };
  const updateNote = (n: NoteCommand) => {
    if (chart && currentLevel && hasCurrentNote) {
      const levelCopied = { ...currentLevel };
      const newLevel = luaUpdateNote(levelCopied, currentNoteIndex, n);
      changeLevel(newLevel);
    }
    // ref.current.focus();
  };
  const [copyBuf, setCopyBuf] = useState<(NoteCommand | null)[]>(
    ([defaultNoteCommand()] as (NoteCommand | null)[]).concat(
      Array.from(new Array(9)).map(() => null)
    )
  );
  const copyNote = (copyIndex: number) => {
    if (chart && currentLevel && hasCurrentNote) {
      const newCopyBuf = copyBuf.slice();
      newCopyBuf[copyIndex] = currentLevel.notes[currentNoteIndex];
      setCopyBuf(newCopyBuf);
    }
    ref.current.focus();
  };
  const pasteNote = (copyIndex: number, forceAdd: boolean = false) => {
    if (copyBuf[copyIndex]) {
      if (chart) {
        if (hasCurrentNote && !forceAdd) {
          updateNote(copyBuf[copyIndex]);
        } else {
          addNote(copyBuf[copyIndex]);
        }
      }
    }
    ref.current.focus();
  };

  if (chart === undefined) {
    if (loading) {
      return <Loading />;
    }
    if (errorStatus !== undefined || errorMsg !== undefined) {
      return <Error status={errorStatus} message={errorMsg} />;
    }
    return (
      <CenterBoxOnlyPage>
        <Header reload>Edit</Header>
        <p>編集用パスワードを入力してください。</p>
        {passwdFailed && <p>パスワードが違います。</p>}
        <Input
          actualValue={editPasswd}
          updateValue={setEditPasswd}
          left
          passwd
        />
        <Button
          text="進む"
          onClick={() => {
            void (async () => {
              setPasswd(cidInitial.current || "", await hashPasswd(editPasswd));
              await fetchChart(false);
            })();
          }}
        />
      </CenterBoxOnlyPage>
    );
  }

  return (
    <main
      className={
        "overflow-x-hidden edit-wide:h-screen edit-wide:overflow-y-hidden " +
        (dragMode !== null ? "touch-none " : "")
      }
      tabIndex={0}
      ref={ref}
      onKeyDown={(e) => {
        if (ready && !isCodeTab) {
          if (e.key === " " && !playing) {
            start();
          } else if (
            (e.key === "Escape" || e.key === "Esc" || e.key === " ") &&
            playing
          ) {
            stop();
          } else if (e.key === "Left" || e.key === "ArrowLeft") {
            seekLeft1();
          } else if (e.key === "Right" || e.key === "ArrowRight") {
            seekRight1();
          } else if (e.key === "PageUp") {
            seekStepRel(-snapDivider * 4);
          } else if (e.key === "PageDown") {
            seekStepRel(snapDivider * 4);
          } else if (e.key === ",") {
            seekSec(-1 / 30);
          } else if (e.key === ".") {
            seekSec(1 / 30);
          } else if (e.key === "c") {
            copyNote(0);
          } else if (e.key === "v") {
            pasteNote(0);
          } else if (
            Number(e.key) >= 1 &&
            Number(e.key) <= copyBuf.length - 1
          ) {
            pasteNote(Number(e.key));
          } else if (e.key === "n") {
            pasteNote(0, true);
          } else if (e.key === "b") {
            if (
              currentNoteIndex >= 0 &&
              currentLevel?.notes[currentNoteIndex]
            ) {
              const n = currentLevel.notes[currentNoteIndex];
              updateNote({ ...n, big: !n.big });
            }
          } else if (e.key === "Shift") {
            setDragMode("v");
          } else {
          }
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Shift" || e.key === "Control") {
          setDragMode("p");
        }
      }}
    >
      <div
        className={
          "w-full " +
          "edit-wide:h-full edit-wide:flex edit-wide:items-stretch edit-wide:flex-row "
        }
      >
        <div
          className={
            "edit-wide:basis-4/12 edit-wide:h-full " +
            "grow-0 shrink-0 flex flex-col items-stretch p-3"
          }
        >
          <div className="flex flex-row items-center">
            <Header reload>Edit</Header>
            <Button text="？" onClick={openGuide} />
          </div>
          <div
            className={
              "grow-0 shrink-0 mt-3 p-3 rounded-lg flex flex-col items-center " +
              (levelBgColors[levelTypes.indexOf(currentLevel?.type || "")] ||
                levelBgColors[1])
            }
          >
            <FlexYouTube
              fixedSide="width"
              className={"w-full h-max " + "edit-wide:w-full edit-wide:h-auto "}
              control={true}
              id={chart?.ytId}
              ytPlayer={ytPlayer}
              onReady={onReady}
              onStart={onStart}
              onStop={onStop}
              onPlaybackRateChange={setPlaybackRate}
            />
          </div>
          <div
            className={
              "relative " +
              "w-full aspect-square " +
              "edit-wide:flex-1 edit-wide:basis-8/12 edit-wide:aspect-auto "
            }
          >
            <FallingWindow
              inCodeTab={isCodeTab}
              className="absolute inset-0"
              notes={notesAll}
              currentTimeSec={currentTimeSec || 0}
              currentNoteIndex={currentNoteIndex}
              currentLevel={currentLevel}
              updateNote={updateNote}
              dragMode={dragMode}
              setDragMode={setDragMode}
            />
          </div>
          {isTouch && (
            <button
              className={"self-start flex flex-row items-center " + linkStyle1}
              onClick={() => {
                setDragMode(
                  dragMode === "p" ? "v" : dragMode === "v" ? null : "p"
                );
              }}
            >
              <span className="relative inline-block w-8 h-8 ">
                {dragMode === null ? (
                  <>
                    <Move className="absolute text-xl inset-0 w-max h-max m-auto " />
                    <Forbid className="absolute text-3xl inset-0 w-max h-max m-auto " />
                  </>
                ) : (
                  <>
                    <Move
                      className="absolute text-xl inset-0 w-max h-max m-auto "
                      theme="two-tone"
                      fill={["#333", "#fc5"]}
                    />
                  </>
                )}
              </span>
              <span className="mr-1">Touch:</span>
              {dragMode === "p"
                ? "move x"
                : dragMode === "v"
                ? "move vx, vy"
                : "off"}
            </button>
          )}
        </div>
        <div
          className={
            "p-3 flex flex-col items-stretch " +
            "h-5/6 " +
            "edit-wide:h-full edit-wide:flex-1 "
          }
        >
          <div>
            <span>Player Control:</span>
            <Select
              options={["✕0.25", "✕0.5", "✕0.75", "✕1", "✕1.5", "✕2"]}
              values={["0.25", "0.5", "0.75", "1", "1.5", "2"]}
              value={playbackRate.toString()}
              onChange={(s: string) => changePlaybackRate(Number(s))}
            />
            <Button
              onClick={() => {
                if (ready) {
                  if (!playing) {
                    start();
                  } else {
                    stop();
                  }
                }
              }}
              text={playing ? "Pause" : "Play"}
              keyName="Space"
            />
            <span className="inline-block">
              <Button
                onClick={() => {
                  if (ready) {
                    seekStepRel(-snapDivider * 4);
                  }
                }}
                text={`-${snapDivider * 4} Step`}
                keyName="PageUp"
              />
              <Button
                onClick={() => {
                  if (ready) {
                    seekStepRel(snapDivider * 4);
                  }
                }}
                text={`+${snapDivider * 4} Step`}
                keyName="PageDn"
              />
            </span>
            <span className="inline-block">
              <Button
                onClick={() => {
                  if (ready) {
                    seekLeft1();
                  }
                }}
                text="-1 Step"
                keyName="←"
              />
              <Button
                onClick={() => {
                  if (ready) {
                    seekRight1();
                  }
                }}
                text="+1 Step"
                keyName="→"
              />
            </span>
            <span className="inline-block">
              <Button
                onClick={() => {
                  if (ready) {
                    seekSec(-1 / 30);
                  }
                }}
                text="-1/30 s"
                keyName=","
              />
              <Button
                onClick={() => {
                  if (ready) {
                    seekSec(1 / 30);
                  }
                }}
                text="+1/30 s"
                keyName="."
              />
            </span>
          </div>
          <div className="flex-none">
            <TimeBar
              currentTimeSecWithoutOffset={currentTimeSecWithoutOffset}
              currentNoteIndex={currentNoteIndex}
              currentStep={currentStep}
              chart={chart}
              currentLevel={currentLevel}
              notesAll={notesAll}
              snapDivider={snapDivider}
              ytId={chart.ytId}
              timeBarPxPerSec={timeBarPxPerSec}
            />
          </div>
          <div className="flex flex-row items-baseline">
            <span>Step =</span>
            <span className="ml-2">1</span>
            <span className="ml-1">/</span>
            <Input
              className="w-12"
              actualValue={String(snapDivider * 4)}
              updateValue={(v: string) => {
                setSnapDivider(Number(v) / 4);
              }}
              isValid={(v) =>
                !isNaN(Number(v)) && String(Math.floor(Number(v) / 4) * 4) === v
              }
            />
            <div className="flex-1" />
            <span>Zoom</span>
            <Button
              text="-"
              onClick={() => setTimeBarPxPerSec(timeBarPxPerSec / 1.5)}
            />
            <Button
              text="+"
              onClick={() => setTimeBarPxPerSec(timeBarPxPerSec * 1.5)}
            />
          </div>
          <div className="flex flex-row ml-3 mt-3">
            {tabNames.map((tabName, i) =>
              i === tab ? (
                <Box key={i} className="rounded-b-none px-3 pt-2 pb-1">
                  {tabName}
                </Box>
              ) : (
                <button
                  key={i}
                  className="rounded-t-lg px-3 pt-2 pb-1 hover:bg-sky-200 hover:dark:bg-orange-950 active:shadow-inner "
                  onClick={() => {
                    setTab(i);
                    ref.current.focus();
                  }}
                >
                  {tabName}
                </button>
              )
            )}
          </div>
          <Box
            className={
              "p-3 overflow-auto " +
              "min-h-96 relative " +
              "edit-wide:flex-1 edit-wide:min-h-0"
            }
          >
            {tab === 0 ? (
              <MetaTab
                sessionId={sessionId}
                sessionData={sessionData}
                fileSize={fileSize}
                chart={chart}
                setChart={changeChart}
                cid={cid}
                setCid={(newCid: string) => setCid(newCid)}
                hasChange={hasChange}
                setHasChange={setHasChange}
                currentLevelIndex={currentLevelIndex}
              />
            ) : tab === 1 ? (
              <TimingTab
                offset={chart?.offset}
                setOffset={changeOffset}
                currentLevel={currentLevel}
                prevBpm={
                  currentBpmIndex !== undefined && currentBpmIndex >= 1
                    ? currentLevel?.bpmChanges[currentBpmIndex - 1].bpm
                    : undefined
                }
                currentBpmIndex={currentBpmIndex}
                currentBpm={
                  currentBpmIndex !== undefined ? currentBpm : undefined
                }
                setCurrentBpm={changeBpm}
                bpmChangeHere={!!bpmChangeHere}
                toggleBpmChangeHere={toggleBpmChangeHere}
                prevSpeed={
                  currentSpeedIndex !== undefined && currentSpeedIndex >= 1
                    ? currentLevel?.speedChanges[currentSpeedIndex - 1].bpm
                    : undefined
                }
                currentSpeedIndex={currentSpeedIndex}
                currentSpeed={
                  currentSpeedIndex !== undefined ? currentSpeed : undefined
                }
                setCurrentSpeed={changeSpeed}
                speedChangeHere={!!speedChangeHere}
                toggleSpeedChangeHere={toggleSpeedChangeHere}
                prevSignature={prevSignature}
                currentSignature={currentSignature}
                setCurrentSignature={changeSignature}
                signatureChangeHere={!!signatureChangeHere}
                toggleSignatureChangeHere={toggleSignatureChangeHere}
                currentStep={currentStep}
              />
            ) : tab === 2 ? (
              <LevelTab
                chart={chart}
                currentLevelIndex={currentLevelIndex}
                setCurrentLevelIndex={setCurrentLevelIndex}
                changeChart={changeChart}
              />
            ) : tab === 3 ? (
              <NoteTab
                currentNoteIndex={currentNoteIndex}
                hasCurrentNote={hasCurrentNote}
                notesIndexInStep={notesIndexInStep}
                notesCountInStep={notesCountInStep}
                canAddNote={canAddNote}
                addNote={addNote}
                deleteNote={deleteNote}
                updateNote={updateNote}
                copyNote={copyNote}
                pasteNote={pasteNote}
                hasCopyBuf={copyBuf.map((n) => n !== null)}
                currentStep={currentStep}
                currentLevel={currentLevel}
              />
            ) : (
              <LuaTab
                currentLevel={currentLevel}
                changeLevel={changeLevel}
                seekStepAbs={(s: Step) => seekStepAbs(s, false)}
                themeContext={themeContext}
              />
            )}
          </Box>
        </div>
      </div>
      {guidePage !== null && (
        <GuideMain
          index={guidePage}
          setIndex={setGuidePage}
          close={() => setGuidePage(null)}
        />
      )}
    </main>
  );
}
