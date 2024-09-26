"use client";

import {
  defaultNoteCommand,
  NoteCommand,
  updateBpmTimeSec,
} from "@/chartFormat/command";
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
import { useResizeDetector } from "react-resize-detector";
import Button from "@/common/button";
import TimeBar from "./timeBar";
import Input from "@/common/input";
import TimingTab from "./timingTab";
import NoteTab from "./noteTab";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import {
  Box,
  CenterBox,
  CenterBoxOnlyPage,
  Error,
  Loading,
} from "@/common/box";
import { MetaTab } from "./metaTab";
import msgpack from "@ygoe/msgpack";
import { addRecent } from "@/common/recent";
import { Chart, hashPasswd } from "@/chartFormat/chart";
import { Step, stepAdd, stepCmp, stepZero } from "@/chartFormat/step";
import { useDisplayMode } from "@/scale";
import BackButton from "@/common/backButton";
import { useRouter, useSearchParams } from "next/navigation";
import { getPasswd, setPasswd } from "@/common/passwdCache";

export default function Page(context: { params: Params }) {
  const cid = context.params.cid;

  // chartのgetやpostに必要なパスワード
  // post時には前のchartのパスワードを入力し、その後は新しいパスワードを使う
  const [editPasswd, setEditPasswd] = useState<string>("");
  const [passwdFailed, setPasswdFailed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [chart, setChart] = useState<Chart>();
  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMsg, setErrorMsg] = useState<string>();
  const fetchChart = useCallback(async () => {
    setPasswdFailed(false);
    setLoading(true);
    const res = await fetch(
      `/api/chartFile/${cid}?p=${await hashPasswd(getPasswd(cid))}`,
      { cache: "no-store" }
    );
    setLoading(false);
    if (res.ok) {
      try {
        const chart = msgpack.deserialize(await res.arrayBuffer());
        // validateはサーバー側でやってる
        setPasswd(cid, chart.editPasswd);
        setChart(chart);
        setErrorStatus(undefined);
        setErrorMsg(undefined);
        addRecent("edit", cid);
      } catch (e) {
        setChart(undefined);
        setErrorStatus(undefined);
        setErrorMsg(String(e));
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
          setErrorMsg(String(e));
        }
      }
    }
  }, [cid]);
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

  const { screenWidth, screenHeight, rem } = useDisplayMode();
  const isMobile = screenWidth < 50 * rem;
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

  // currentTimeが変わったときcurrentStepを更新
  useEffect(() => {
    if (chart) {
      const step = getStep(chart.bpmChanges, currentTimeSec, snapDivider);
      if (stepCmp(step, currentStep) !== 0) {
        setCurrentStep(step);
      }
      if (
        currentNoteIndex < 0 ||
        chart.notes[currentNoteIndex] === undefined ||
        stepCmp(chart.notes[currentNoteIndex].step, step) != 0
      ) {
        const noteIndex = chart.notes.findIndex(
          (n) => stepCmp(n.step, step) == 0
        );
        if (currentNoteIndex !== noteIndex) {
          setCurrentNoteIndex(noteIndex);
        }
      }
    }
  }, [chart, snapDivider, currentTimeSec, currentStep, currentNoteIndex]);

  const ytPlayer = useRef<YouTubePlayer>();
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
  const changeCurrentTimeSec = (timeSec: number) => {
    if (ytPlayer.current?.seekTo) {
      ytPlayer.current?.seekTo(timeSec, true);
    }
    ref.current.focus();
  };
  const seekStepRel = (move: number) => {
    if (chart) {
      let newStep = stepAdd(currentStep, {
        fourth: 0,
        numerator: move,
        denominator: snapDivider,
      });
      if (stepCmp(newStep, stepZero()) < 0) {
        newStep = stepZero();
      }
      changeCurrentTimeSec(
        getTimeSec(chart.bpmChanges, newStep) + chart.offset
      );
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

  const changeOffset = (ofs: number) => {
    if (chart /*&& offsetValid(ofs)*/) {
      changeChart({ ...chart, offset: ofs });
    }
  };
  const changeWaveOffset = (ofs: number) => {
    if (chart /*&& offsetValid(ofs)*/) {
      changeChart({ ...chart, waveOffset: ofs });
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
        chart.bpmChanges.push({
          step: stepZero(),
          bpm: bpm,
          timeSec: 0,
        });
      } else {
        chart.bpmChanges[currentBpmIndex].bpm = bpm;
        updateBpmTimeSec(chart.bpmChanges);
      }
      changeChart({ ...chart });
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
        chart.bpmChanges = chart.bpmChanges.filter(
          (ch) => stepCmp(ch.step, currentStep) !== 0
        );
        updateBpmTimeSec(chart.bpmChanges);
        changeChart({ ...chart });
      } else {
        chart.bpmChanges.push({
          step: currentStep,
          bpm: currentBpm,
          timeSec: currentTimeSec,
        });
        chart.bpmChanges = chart.bpmChanges.sort((a, b) =>
          stepCmp(a.step, b.step)
        );
        changeChart({ ...chart });
      }
    }
  };

  const addNote = (n: NoteCommand) => {
    if (chart) {
      const newChart = { ...chart };
      newChart.notes.push({ ...n, step: currentStep });
      newChart.notes = newChart.notes.sort((a, b) => stepCmp(a.step, b.step));
      changeChart(newChart);
    }
    ref.current.focus();
  };
  const deleteNote = () => {
    if (chart && currentNoteIndex >= 0) {
      const newChart = { ...chart };
      newChart.notes = newChart.notes.filter((_, i) => i !== currentNoteIndex);
      changeChart(newChart);
    }
    ref.current.focus();
  };
  const updateNote = (n: NoteCommand) => {
    if (chart && currentNoteIndex >= 0) {
      const newChart = { ...chart };
      newChart.notes[currentNoteIndex] = {
        ...n,
        step: newChart.notes[currentNoteIndex].step,
      };
      newChart.notes = newChart.notes.sort((a, b) => stepCmp(a.step, b.step));
      changeChart(newChart);
    }
    // ref.current.focus();
  };
  const [copyBuf, setCopyBuf] = useState<(NoteCommand | null)[]>(
    ([defaultNoteCommand()] as (NoteCommand | null)[]).concat(
      Array.from(new Array(7)).map(() => null)
    )
  );
  const copyNote = (copyIndex: number) => {
    if (chart && currentNoteIndex >= 0) {
      const newCopyBuf = copyBuf.slice();
      newCopyBuf[copyIndex] = chart.notes[currentNoteIndex];
      setCopyBuf(newCopyBuf);
    }
    ref.current.focus();
  };
  const pasteNote = (copyIndex: number, forceAdd: boolean = false) => {
    if (copyBuf[copyIndex]) {
      if (chart) {
        if (currentNoteIndex >= 0 && !forceAdd) {
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
        <BackButton className="" href="/main/edit" reload>
          Edit
        </BackButton>
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
            setPasswd(cid, editPasswd);
            void fetchChart();
          }}
        />
      </CenterBoxOnlyPage>
    );
  }

  return (
    <main
      className={
        "overflow-x-hidden " + (isMobile ? "" : "h-screen overflow-y-hidden ")
      }
      style={{ touchAction: "none" }}
      tabIndex={0}
      ref={ref}
      onKeyDown={(e) => {
        if (ready) {
          if (e.key === " " && !playing) {
            start();
          } else if (
            (e.key === "Escape" || e.key === "Esc" || e.key === " ") &&
            playing
          ) {
            stop();
          } else if (e.key === "Left" || e.key === "ArrowLeft") {
            seekStepRel(-1);
          } else if (e.key === "Right" || e.key === "ArrowRight") {
            seekStepRel(1);
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
          } else {
          }
        }
      }}
    >
      <div
        className={
          "w-full " + (isMobile ? "" : "h-full flex items-stretch flex-row ")
        }
      >
        <div
          className={
            (isMobile ? "" : "basis-4/12 h-full ") +
            "grow-0 shrink-0 flex flex-col items-stretch p-3"
          }
        >
          <BackButton className="" href="/main/edit" reload>
            Edit
          </BackButton>
          <div
            className={
              "grow-0 shrink-0 p-3 bg-amber-700 rounded-lg flex flex-col items-center "
            }
          >
            <FlexYouTube
              fixedSide="width"
              className={isMobile ? "w-full h-max" : "w-full "}
              isMobile={false}
              control={true}
              id={chart?.ytId}
              ytPlayer={ytPlayer}
              onReady={onReady}
              onStart={onStart}
              onStop={onStop}
            />
          </div>
          <div
            className={
              "relative " +
              (isMobile ? "w-full aspect-square" : "flex-1 basis-8/12 ")
            }
          >
            <FallingWindow
              className="absolute inset-0"
              notes={notesAll}
              currentTimeSec={currentTimeSec || 0}
              currentNoteIndex={currentNoteIndex}
              chart={chart}
              updateNote={updateNote}
            />
          </div>
        </div>
        <div
          className={
            "p-3 flex flex-col items-stretch " +
            (isMobile ? "h-5/6 " : "flex-1 ")
          }
        >
          <div>
            <span>Player Control:</span>
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
            />
            <Button
              onClick={() => {
                if (ready) {
                  seekStepRel(-1);
                }
              }}
              text="-1 Step"
              keyName="←"
            />
            <Button
              onClick={() => {
                if (ready) {
                  seekStepRel(1);
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
            />
          </div>
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
          <p className="flex flex-row items-baseline">
            <span>Step =</span>
            <span className="ml-2">1</span>
            <span className="ml-1">/</span>
            <Input
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
            {["Meta", "Timing", "Notes"].map((tabName, i) =>
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
          <Box className="flex-1 p-3 overflow-auto min-h-96">
            {tab === 0 ? (
              <MetaTab
                chart={chart}
                setChart={changeChart}
                cid={cid}
                hasChange={hasChange}
                setHasChange={setHasChange}
              />
            ) : tab === 1 ? (
              <TimingTab
                offset={chart?.offset}
                setOffset={changeOffset}
                waveOffset={chart?.waveOffset}
                setWaveOffset={changeWaveOffset}
                currentBpm={
                  currentBpmIndex !== undefined ? currentBpm : undefined
                }
                setCurrentBpm={changeBpm}
                bpmChangeHere={!!bpmChangeHere}
                toggleBpmChangeHere={toggleBpmChangeHere}
                currentStep={currentStep}
              />
            ) : (
              <NoteTab
                currentNoteIndex={currentNoteIndex}
                deleteNote={deleteNote}
                updateNote={updateNote}
                copyNote={copyNote}
                pasteNote={pasteNote}
                hasCopyBuf={copyBuf.map((n) => n !== null)}
                currentStep={currentStep}
                chart={chart}
              />
            )}
          </Box>
        </div>
      </div>
    </main>
  );
}
