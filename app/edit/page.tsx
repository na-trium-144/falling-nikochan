"use client";

import {
  Chart,
  NoteCommand,
  sampleChart,
  Step,
  stepAdd,
  stepCmp,
} from "@/chartFormat/command";
import FlexYouTube from "@/youtube";
import { YouTubePlayer } from "@/youtubePlayer";
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
import Button from "./button";
import TimeBar from "./timeBar";
import Input from "./input";
import TimingTab from "./timingTab";
import NoteTab from "./noteTab";

export default function Page() {
  const [chart, setChart] = useState<Chart | null>(null);
  // 現在時刻 offsetを引く前
  // setはytPlayerから取得。変更するにはchangeCurrentTimeSecを呼ぶ
  const [currentTimeSecWithoutOffset, setCurrentTimeSecWithoutOffset] =
    useState<number>(0);
  // 現在時刻に対応するstep
  const [currentStep, setCurrentStep] = useState<Step>({
    fourth: 0,
    numerator: 0,
    denominator: 4,
  });
  // snapの刻み幅 を1stepの4n分の1にする
  const [snapDivider, setSnapDivider] = useState<number>(4);

  useEffect(() => {
    // テスト用
    const ch = sampleChart();
    setChart(ch);
  }, []);

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
        if (
          currentNoteIndex < 0 ||
          stepCmp(chart.notes[currentNoteIndex].step, step) != 0
        ) {
          setCurrentNoteIndex(
            chart.notes.findIndex((n) => stepCmp(n.step, step) == 0)
          );
        }
      }
    }
  }, [chart, snapDivider, currentTimeSec, currentStep, currentNoteIndex]);

  const ytPlayer = useRef<YouTubePlayer | null>(null);
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
      changeCurrentTimeSec(
        getTimeSec(
          chart.bpmChanges,
          stepAdd(currentStep, {
            fourth: 0,
            numerator: move,
            denominator: snapDivider,
          })
        ) + chart.offset
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
  const changeBpm = (bpm: number) => {
    if (chart /*&& bpmValid(bpm)*/) {
      const bpmChangeIndex = findBpmIndexFromStep(
        chart.bpmChanges,
        currentStep
      );
      chart.bpmChanges[bpmChangeIndex].bpm = bpm;
    }
  };
  const toggleBpmChangeHere = () => {};

  const addNote = () => {
    if (chart) {
      const newChart = { ...chart };
      newChart.notes.push({
        step: currentStep,
        hitX: 1 / 4,
        hitVX: 1 / 4,
        hitVY: 1,
        accelY: 1 / 4,
        timeScale: [
          { stepBefore: { fourth: 0, numerator: 0, denominator: 4 }, scale: 1 },
        ],
      });
      newChart.notes = newChart.notes.sort((a, b) => stepCmp(a.step, b.step));
      setChart(newChart);
    }
  };
  const deleteNote = () => {
    if (chart && currentNoteIndex !== null) {
      const newChart = { ...chart };
      newChart.notes = newChart.notes.filter((n, i) => i !== currentNoteIndex);
      setChart(newChart);
    }
  };
  const updateNote = (n: NoteCommand) => {
    if (chart && currentNoteIndex !== null) {
      const newChart = { ...chart };
      newChart.notes[currentNoteIndex] = n;
      newChart.notes = newChart.notes.sort((a, b) => stepCmp(a.step, b.step));
      setChart(newChart);
    }
  };

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
          } else if (
            e.key === "n" &&
            currentNoteIndex !== null &&
            currentNoteIndex < 0
          ) {
            addNote();
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
            {["Timing", "Notes", "Coding"].map((tabName, i) =>
              i === tab ? (
                <span
                  key={i}
                  className="rounded-t-lg px-3 pt-2 pb-1"
                  style={{
                    background: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {tabName}
                </span>
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
          <div
            className="flex-1 rounded-lg p-3"
            style={{ background: "rgba(255, 255, 255, 0.5)" }}
          >
            {tab === 0 ? (
              <TimingTab
                offset={chart?.offset}
                setOffset={changeOffset}
                currentBpm={chart?.bpmChanges[0].bpm}
                setCurrentBpm={changeBpm}
                bpmChangeHere={false}
                toggleBpmChangeHere={toggleBpmChangeHere}
              />
            ) : (
              <NoteTab
                currentNoteIndex={currentNoteIndex}
                addNote={addNote}
                deleteNote={deleteNote}
                updateNote={updateNote}
                chart={chart}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
