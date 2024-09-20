"use client";

import {
  Chart,
  defaultNoteCommand,
  NoteCommand,
  sampleChart,
  Step,
  stepAdd,
  stepCmp,
  stepZero,
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
import { IChartFileGet } from "@/api/chartFile/interface";
import {
  Box,
  CenterBox,
  CenterBoxOnlyPage,
  ChartFetchError,
  Loading,
} from "@/common/box";
import MetaTab from "./metaTab";

export default function Page(context: { params: Params }) {
  const cid = context.params.cid;
  const [chart, setChart] = useState<Chart>();
  const [chartFetchError, setChartFetchError] = useState<boolean>(false);
  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/chartFile/${cid}`);
      const resBody = (await res.json()) as IChartFileGet;
      if (resBody.ok && resBody.chart !== undefined) {
        setChart(resBody.chart);
        setChartFetchError(false);
      } else {
        setChart(undefined);
        setChartFetchError(true);
      }
    })();
  }, [cid]);

  // 現在時刻 offsetを引く前
  // setはytPlayerから取得。変更するにはchangeCurrentTimeSecを呼ぶ
  const [currentTimeSecWithoutOffset, setCurrentTimeSecWithoutOffset] =
    useState<number>(0);
  // 現在時刻に対応するstep
  const [currentStep, setCurrentStep] = useState<Step>(stepZero());
  // snapの刻み幅 を1stepの4n分の1にする
  const [snapDivider, setSnapDivider] = useState<number>(4);

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
  };
  const stop = () => {
    ytPlayer.current?.pauseVideo();
  };
  const changeCurrentTimeSec = (timeSec: number) => {
    if (ytPlayer.current?.seekTo) {
      ytPlayer.current?.seekTo(timeSec, true);
    }
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
      setNotesAll(loadChart(chart));
    }
  }, [chart]);

  const [tab, setTab] = useState<number>(0);

  const changeOffset = (ofs: number) => {
    if (chart /*&& offsetValid(ofs)*/) {
      setChart({ ...chart, offset: ofs });
    }
  };
  const currentBpmIndex =
    chart && findBpmIndexFromStep(chart?.bpmChanges, currentStep);
  const changeBpm = (bpm: number) => {
    if (chart && currentBpmIndex !== undefined) {
      chart.bpmChanges[currentBpmIndex].bpm = bpm;
      updateBpmTimeSec(chart.bpmChanges);
      setChart({ ...chart });
    }
  };
  const bpmChangeHere =
    chart &&
    currentBpmIndex !== undefined &&
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
        setChart({ ...chart });
      } else {
        chart.bpmChanges.push({
          step: currentStep,
          bpm: chart.bpmChanges[currentBpmIndex].bpm,
          timeSec: currentTimeSec,
        });
        chart.bpmChanges = chart.bpmChanges.sort((a, b) =>
          stepCmp(a.step, b.step)
        );
        setChart({ ...chart });
      }
    }
  };

  const addNote = (n: NoteCommand) => {
    if (chart) {
      const newChart = { ...chart };
      newChart.notes.push({ ...n, step: currentStep });
      newChart.notes = newChart.notes.sort((a, b) => stepCmp(a.step, b.step));
      setChart(newChart);
    }
  };
  const deleteNote = () => {
    if (chart && currentNoteIndex >= 0) {
      const newChart = { ...chart };
      newChart.notes = newChart.notes.filter((_, i) => i !== currentNoteIndex);
      setChart(newChart);
    }
  };
  const updateNote = (n: NoteCommand) => {
    if (chart && currentNoteIndex >= 0) {
      const newChart = { ...chart };
      newChart.notes[currentNoteIndex] = n;
      newChart.notes = newChart.notes.sort((a, b) => stepCmp(a.step, b.step));
      setChart(newChart);
    }
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
  };
  const pasteNote = (copyIndex: number) => {
    if (copyBuf[copyIndex]) {
      if (chart) {
        if (currentNoteIndex >= 0) {
          updateNote(copyBuf[copyIndex]);
        } else {
          addNote(copyBuf[copyIndex]);
        }
      }
    }
  };

  if (chartFetchError) {
    return <ChartFetchError />;
  }
  if (chart === undefined) {
    return <Loading />;
  }

  return (
    <main
      className="w-screen min-h-screen overflow-x-hidden overflow-y-hidden"
      style={{ touchAction: "none" }}
      tabIndex={0}
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
          } else {
          }
        }
      }}
    >
      <div className={"w-full h-screen flex items-stretch flex-row"}>
        <div
          className={
            "basis-4/12 " +
            "grow-0 shrink-0 h-full flex flex-col items-stretch p-3"
          }
        >
          <div
            className={
              "grow-0 shrink-0 p-3 bg-amber-700 rounded-lg flex " + "flex-col"
            }
          >
            <FlexYouTube
              className={"block "}
              isMobile={false}
              control={true}
              id={chart?.ytId}
              ytPlayer={ytPlayer}
              onReady={onReady}
              onStart={onStart}
              onStop={onStop}
            />
          </div>
          <div className={"relative flex-1 basis-8/12 "}>
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
        <div className="flex-1 p-3 flex flex-col items-stretch">
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
          </div>
          <TimeBar
            currentTimeSecWithoutOffset={currentTimeSecWithoutOffset}
            currentNoteIndex={currentNoteIndex}
            currentStep={currentStep}
            chart={chart}
            notesAll={notesAll}
            snapDivider={snapDivider}
          />
          <p>
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
          </p>
          <div className="flex flex-row ml-3 mt-3">
            {["Meta", "Timing", "Notes", "Coding"].map((tabName, i) =>
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
          <Box className="flex-1 p-3">
            {tab === 0 ? (
              <MetaTab chart={chart} setChart={setChart} />
            ) : tab === 1 ? (
              <TimingTab
                offset={chart?.offset}
                setOffset={changeOffset}
                currentBpm={
                  currentBpmIndex !== undefined
                    ? chart?.bpmChanges[currentBpmIndex].bpm
                    : undefined
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
                chart={chart}
              />
            )}
          </Box>
        </div>
      </div>
    </main>
  );
}
