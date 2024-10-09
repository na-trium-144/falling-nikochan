"use client";

import { defaultNoteCommand, NoteCommand } from "@/chartFormat/command";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube";
import { useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow";
import {
  findBpmIndexFromStep,
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
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { Box, CenterBoxOnlyPage, Error, Loading } from "@/common/box";
import { MetaTab } from "./metaTab";
import msgpack from "@ygoe/msgpack";
import { addRecent } from "@/common/recent";
import { Chart, emptyChart, hashPasswd } from "@/chartFormat/chart";
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

export default function Page(context: { params: Params }) {
  // cid が "new" の場合空のchartで編集をはじめて、post時にcidが振られる
  const cidInitial = useRef<string>(context.params.cid);
  const [cid, setCid] = useState<string | undefined>(context.params.cid);

  // chartのgetやpostに必要なパスワード
  // post時には前のchartのパスワードを入力し、その後は新しいパスワードを使う
  const [editPasswd, setEditPasswd] = useState<string>("");
  const [passwdFailed, setPasswdFailed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [chart, setChart] = useState<Chart>();
  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMsg, setErrorMsg] = useState<string>();

  const fetchChart = useCallback(async () => {
    if (cidInitial.current === "new") {
      setChart(emptyChart());
      setPasswdFailed(false);
      setLoading(false);
      setCid(undefined);
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
          setPasswdFailed(true);
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
  useEffect(() => void fetchChart(), [fetchChart]);

  const [hasChange, setHasChange] = useState<boolean>(false);
  const changeChart = (chart: Chart) => {
    setHasChange(true);
    setChart(chart);
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
  }, [hasChange]);

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
    currentNoteIndex >= 0 && chart?.notes[currentNoteIndex] !== undefined;

  // currentTimeが変わったときcurrentStepを更新
  const prevTimeSec = useRef<number>(-1);
  useEffect(() => {
    if (chart && currentTimeSec !== prevTimeSec.current) {
      const step = getStep(chart.bpmChanges, currentTimeSec, snapDivider);
      if (stepCmp(step, currentStep) !== 0) {
        setCurrentStep(step);
      }
      if (
        !hasCurrentNote ||
        stepCmp(chart.notes[currentNoteIndex].step, step) != 0
      ) {
        let noteIndex: number;
        if (currentTimeSec < prevTimeSec.current) {
          noteIndex = chart.notes.findLastIndex(
            (n) => stepCmp(n.step, step) == 0
          );
        } else {
          noteIndex = chart.notes.findIndex((n) => stepCmp(n.step, step) == 0);
        }
        if (currentNoteIndex !== noteIndex) {
          setCurrentNoteIndex(noteIndex);
        }
      }
    }
    prevTimeSec.current = currentTimeSec;
  }, [
    chart,
    snapDivider,
    currentTimeSec,
    currentStep,
    currentNoteIndex,
    hasCurrentNote,
  ]);

  const ytPlayer = useRef<YouTubePlayer>();
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
    if (chart) {
      if (
        hasCurrentNote &&
        chart.notes[currentNoteIndex + 1] &&
        stepCmp(currentStep, chart.notes[currentNoteIndex + 1].step) === 0
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
        chart.notes[currentNoteIndex - 1] &&
        stepCmp(currentStep, chart.notes[currentNoteIndex - 1].step) === 0
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
    if (chart) {
      if (stepCmp(newStep, stepZero()) < 0) {
        newStep = stepZero();
      }
      changeCurrentTimeSec(
        getTimeSec(chart.bpmChanges, newStep) + chart.offset,
        focus
      );
    }
    if (focus) {
      ref.current.focus();
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
      setNotesAll(loadChart(chart).notes);
    }
  }, [chart]);

  const [tab, setTab] = useState<number>(0);

  const [dragMode, setDragMode] = useState<"p" | "v">("p");

  const changeOffset = (ofs: number) => {
    if (chart /*&& offsetValid(ofs)*/) {
      changeChart({ ...chart, offset: ofs });
    }
  };
  const currentBpmIndex =
    chart && findBpmIndexFromStep(chart?.bpmChanges, currentStep);
  const currentBpm =
    chart && chart.bpmChanges.length > 0 && currentBpmIndex !== undefined
      ? chart.bpmChanges[currentBpmIndex].bpm
      : 120;
  const changeBpm = (bpm: number) => {
    if (chart && currentBpmIndex !== undefined) {
      if (chart.bpmChanges.length === 0) {
        throw "bpmChanges empty";
        // chart.bpmChanges.push({
        //   step: stepZero(),
        //   bpm: bpm,
        //   timeSec: 0,
        // });
      } else {
        const newChart = luaUpdateBpmChange(chart, currentBpmIndex, bpm);
        if (newChart !== null) {
          changeChart({ ...newChart });
        }
      }
    }
  };
  const bpmChangeHere =
    chart &&
    currentBpmIndex !== undefined &&
    chart.bpmChanges.length > 0 &&
    stepCmp(chart.bpmChanges[currentBpmIndex].step, currentStep) === 0;
  const toggleBpmChangeHere = () => {
    if (
      chart &&
      currentBpmIndex !== undefined &&
      stepCmp(currentStep, stepZero()) > 0
    ) {
      if (bpmChangeHere) {
        const newChart = luaDeleteBpmChange(chart, currentBpmIndex);
        if (newChart !== null) {
          changeChart({ ...newChart });
        }
      } else {
        const newChart = luaAddBpmChange(chart, {
          step: currentStep,
          bpm: currentBpm,
          timeSec: currentTimeSec,
        });
        if (newChart !== null) {
          changeChart({ ...newChart });
        }
      }
    }
  };

  const currentSpeedIndex =
    chart && findBpmIndexFromStep(chart?.speedChanges, currentStep);
  const currentSpeed =
    chart && chart.speedChanges.length > 0 && currentSpeedIndex !== undefined
      ? chart.speedChanges[currentSpeedIndex].bpm
      : 120;
  const changeSpeed = (bpm: number) => {
    if (chart && currentSpeedIndex !== undefined) {
      if (chart.speedChanges.length === 0) {
        throw "speedChanges empty";
        // chart.speedChanges.push({
        //   step: stepZero(),
        //   bpm: bpm,
        //   timeSec: 0,
        // });
      } else {
        const newChart = luaUpdateSpeedChange(chart, currentSpeedIndex, bpm);
        if (newChart) {
          changeChart({ ...newChart });
        }
      }
    }
  };
  const speedChangeHere =
    chart &&
    currentSpeedIndex !== undefined &&
    chart.speedChanges.length > 0 &&
    stepCmp(chart.speedChanges[currentSpeedIndex].step, currentStep) === 0;
  const toggleSpeedChangeHere = () => {
    if (
      chart &&
      currentSpeedIndex !== undefined &&
      stepCmp(currentStep, stepZero()) > 0
    ) {
      if (speedChangeHere) {
        const newChart = luaDeleteSpeedChange(chart, currentSpeedIndex);
        if (newChart) {
          changeChart({ ...newChart });
        }
      } else {
        const newChart = luaAddSpeedChange(chart, {
          step: currentStep,
          bpm: currentSpeed,
          timeSec: currentTimeSec,
        });
        if (newChart) {
          changeChart({ ...newChart });
        }
      }
    }
  };

  const addNote = (n: NoteCommand | null = copyBuf[0]) => {
    if (chart && n) {
      const chartCopied = { ...chart };
      const newChart = luaAddNote(chartCopied, n, currentStep);
      if (newChart !== null) {
        changeChart(newChart);
        // 追加したnoteは同じ時刻の音符の中でも最後
        setCurrentNoteIndex(
          chart.notes.findLastIndex((n) => stepCmp(n.step, currentStep) == 0)
        );
      }
    }
    ref.current.focus();
  };
  const deleteNote = () => {
    if (chart && hasCurrentNote) {
      const chartCopied = { ...chart };
      const newChart = luaDeleteNote(chartCopied, currentNoteIndex);
      if (newChart !== null) {
        changeChart(newChart);
      }
    }
    ref.current.focus();
  };
  const updateNote = (n: NoteCommand) => {
    if (chart && hasCurrentNote) {
      const chartCopied = { ...chart };
      const newChart = luaUpdateNote(chartCopied, currentNoteIndex, n);
      if (newChart !== null) {
        changeChart(newChart);
      }
    }
    // ref.current.focus();
  };
  const [copyBuf, setCopyBuf] = useState<(NoteCommand | null)[]>(
    ([defaultNoteCommand()] as (NoteCommand | null)[]).concat(
      Array.from(new Array(7)).map(() => null)
    )
  );
  const copyNote = (copyIndex: number) => {
    if (chart && hasCurrentNote) {
      const newCopyBuf = copyBuf.slice();
      newCopyBuf[copyIndex] = chart.notes[currentNoteIndex];
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
              await fetchChart();
            })();
          }}
        />
      </CenterBoxOnlyPage>
    );
  }

  return (
    <main
      className={
        "overflow-x-hidden " + "edit-wide:h-screen edit-wide:overflow-y-hidden "
      }
      style={{ touchAction: "none" }}
      tabIndex={0}
      ref={ref}
      onKeyDown={(e) => {
        if (ready && tab !== 3) {
          if (e.key === " " && !playing) {
            start();
          } else if (
            (e.key === "Escape" || e.key === "Esc" || e.key === " ") &&
            playing
          ) {
            stop();
          } else if (e.key === "Left" || e.key === "ArrowLeft") {
            if (e.shiftKey) {
              seekStepRel(-snapDivider * 4);
            } else {
              seekLeft1();
            }
          } else if (e.key === "Right" || e.key === "ArrowRight") {
            if (e.shiftKey) {
              seekStepRel(snapDivider * 4);
            } else {
              seekRight1();
            }
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
            if (currentNoteIndex >= 0 && chart.notes[currentNoteIndex]) {
              const n = chart.notes[currentNoteIndex];
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
          <Header reload>Edit</Header>
          <div
            className={
              "grow-0 shrink-0 mt-3 p-3 bg-amber-600 rounded-lg flex flex-col items-center "
            }
          >
            <FlexYouTube
              fixedSide="width"
              className={"w-full h-max " + "edit-wide:w-full edit-wide:h-auto "}
              isMobile={false}
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
              className="absolute inset-0"
              notes={notesAll}
              currentTimeSec={currentTimeSec || 0}
              currentNoteIndex={currentNoteIndex}
              chart={chart}
              updateNote={updateNote}
              dragMode={dragMode}
            />
          </div>
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
            <Button
              onClick={() => {
                if (ready) {
                  seekStepRel(-snapDivider * 4);
                }
              }}
              text={`-${snapDivider * 4} Step`}
              keyName={["Shift", "←"]}
            />
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
            <Button
              onClick={() => {
                if (ready) {
                  seekStepRel(snapDivider * 4);
                }
              }}
              text={`+${snapDivider * 4} Step`}
              keyName={["Shift", "→"]}
            />
          </div>
          <div className="flex-none">
            <TimeBar
              currentTimeSecWithoutOffset={currentTimeSecWithoutOffset}
              currentNoteIndex={currentNoteIndex}
              currentStep={currentStep}
              chart={chart}
              notesAll={notesAll}
              snapDivider={snapDivider}
              ytId={chart.ytId}
              timeBarPxPerSec={timeBarPxPerSec}
            />
          </div>
          <p className="flex flex-row items-baseline">
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
          </p>
          <div className="flex flex-row ml-3 mt-3">
            {["Meta", "Timing", "Notes", "Code"].map((tabName, i) =>
              i === tab ? (
                <Box key={i} className="rounded-b-none px-3 pt-2 pb-1">
                  {tabName}
                </Box>
              ) : (
                <button
                  key={i}
                  className="rounded-t-lg px-3 pt-2 pb-1 hover:bg-sky-200"
                  onClick={() => setTab(i)}
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
                chart={chart}
                setChart={changeChart}
                cid={cid}
                setCid={(newCid: string) => setCid(newCid)}
                hasChange={hasChange}
                setHasChange={setHasChange}
              />
            ) : tab === 1 ? (
              <TimingTab
                offset={chart?.offset}
                setOffset={changeOffset}
                prevBpm={
                  currentBpmIndex !== undefined && currentBpmIndex >= 1
                    ? chart.bpmChanges[currentBpmIndex - 1].bpm
                    : undefined
                }
                currentBpm={
                  currentBpmIndex !== undefined ? currentBpm : undefined
                }
                setCurrentBpm={changeBpm}
                bpmChangeHere={!!bpmChangeHere}
                toggleBpmChangeHere={toggleBpmChangeHere}
                prevSpeed={
                  currentSpeedIndex !== undefined && currentSpeedIndex >= 1
                    ? chart.speedChanges[currentSpeedIndex - 1].bpm
                    : undefined
                }
                currentSpeed={
                  currentSpeedIndex !== undefined ? currentSpeed : undefined
                }
                setCurrentSpeed={changeSpeed}
                speedChangeHere={!!speedChangeHere}
                toggleSpeedChangeHere={toggleSpeedChangeHere}
                currentStep={currentStep}
              />
            ) : tab === 2 ? (
              <NoteTab
                currentNoteIndex={currentNoteIndex}
                addNote={addNote}
                deleteNote={deleteNote}
                updateNote={updateNote}
                copyNote={copyNote}
                pasteNote={pasteNote}
                hasCopyBuf={copyBuf.map((n) => n !== null)}
                currentStep={currentStep}
                chart={chart}
              />
            ) : (
              <LuaTab
                chart={chart}
                changeChart={changeChart}
                seekStepAbs={(s: Step) => seekStepAbs(s, false)}
              />
            )}
          </Box>
        </div>
      </div>
    </main>
  );
}
