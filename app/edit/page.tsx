"use client";

import { Chart, sampleChart } from "@/chartFormat/command";
import FlexYouTube from "@/youtube";
import { YouTubePlayer } from "@/youtubePlayer";
import { useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow";
import {
  getBpm,
  getStep,
  getTimeSec,
  loadChart,
  Note,
} from "@/chartFormat/seq";
import { useResizeDetector } from "react-resize-detector";
import Button from "./button";
import TimeBar from "./timeBar";
import Input from "./input";

export default function Page() {
  const [chart, setChart] = useState<Chart | null>(null);
  // 現在時刻 offsetを引く前
  // setはytPlayerから取得。変更するにはchangeCurrentTimeSecを呼ぶ
  const [currentTimeSecWithoutOffset, setCurrentTimeSecWithoutOffset] =
    useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  useEffect(() => {
    // テスト用
    const ch = sampleChart();
    setChart(ch);
  }, []);
  const currentTimeSec = currentTimeSecWithoutOffset - (chart?.offset || 0);
  const currentNoteIndex =
    chart &&
    chart.notes.indexOf(
      chart.notes.reduce(
        (prevN, n) =>
          Math.abs(n.step - currentStep) < Math.abs(prevN.step - currentStep)
            ? n
            : prevN,
        chart.notes[0]
      )
    );
  useEffect(() => {
    if (chart) {
      setCurrentStep(
        getStep(chart?.bpmChanges, currentTimeSecWithoutOffset - chart.offset)
      );
    }
  }, [chart, currentTimeSecWithoutOffset]);

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
    ytPlayer.current?.seekTo(timeSec, true);
  };
  const seekStepRel = (move: number) => {
    if (chart) {
      changeCurrentTimeSec(
        getTimeSec(chart.bpmChanges, Math.round(currentStep + move)) +
          chart.offset
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

  const offsetValid = (offset: string) =>
    !isNaN(Number(offset)) && Number(offset) >= 0;
  const changeOffset = (ofs: string) => {
    if (chart /*&& offsetValid(ofs)*/) {
      setChart({ ...chart, offset: Number(ofs) });
    }
  };

  const bpmValid = (bpm: string) => !isNaN(Number(bpm)) && Number(bpm) >= 0;
  const changeBpm = (bpm: string) => {
    if (chart /*&& bpmValid(bpm)*/) {
      let bpmChangeIndex =
        chart.bpmChanges.findIndex((ch) => ch.step > currentStep) - 1;
      if (bpmChangeIndex < 0) {
        bpmChangeIndex = chart.bpmChanges.length - 1;
      }
      chart.bpmChanges[bpmChangeIndex].bpm = Number(bpm);
    }
  };
  const toggleBpmChangeHere = () => {};

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
          />
          <div className="flex flex-row pl-3">
            <span
              className="rounded-t-lg px-3 pt-2 pb-1"
              style={{ background: "rgba(255, 255, 255, 0.5)" }}
            >
              Timing
            </span>
            <span className="px-3 pt-2 pb-1">Notes</span>
            <span className="px-3 pt-2 pb-1">Coding</span>
          </div>
          <div
            className="flex-1 rounded-lg p-3"
            style={{ background: "rgba(255, 255, 255, 0.5)" }}
          >
            <p>
              <span>Offset</span>
              <Input
                actualValue={chart ? chart.offset.toString() : ""}
                updateValue={changeOffset}
                isValid={offsetValid}
              />
              <span>s</span>
            </p>
            <p>
              <span>Current BPM:</span>
              <Input
                actualValue={chart ? chart.bpmChanges[0].bpm.toString() : ""}
                updateValue={changeBpm}
                isValid={bpmValid}
              />
            </p>
            <p>
              <input
                className="ml-4 mr-1"
                type="checkbox"
                id="bpmChangeHere"
                checked={false}
                onChange={toggleBpmChangeHere}
              />
              <label htmlFor="bpmChangeHere">
                <span>Change At</span>
                <span className="ml-2">{Math.round(currentStep)}</span>
              </label>
              <span className="ml-1">:</span>
              <Input
                actualValue={chart ? chart.bpmChanges[0].bpm.toString() : ""}
                updateValue={changeBpm}
                isValid={bpmValid}
              />
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
