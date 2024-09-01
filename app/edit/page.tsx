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
import { Key } from "@/messageBox";

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
    setOffset(ch.offset.toString());
    setBpm(ch.bpmChanges[0].bpm.toString());
  }, []);
  const currentTimeSec = currentTimeSecWithoutOffset - (chart?.offset || 0);
  const currentBpm = chart && getBpm(chart.bpmChanges, currentTimeSec);
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
    if (currentBpm) {
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

  const timeBarResize = useResizeDetector();
  const timeBarWidth = timeBarResize.width || 500;
  const timeBarRef = timeBarResize.ref;
  // timebar左端の時刻
  const [timeBarBeginSec, setTimeBarBeginSec] = useState<number>(-1);

  const timeBarPxPerSec = 300;
  // timebar上の位置を計算
  const timeBarPos = (timeSec: number) =>
    (timeSec - timeBarBeginSec) * timeBarPxPerSec;
  useEffect(() => {
    const marginPxLeft = 50;
    const marginPxRight = 300;
    if (
      currentTimeSecWithoutOffset - timeBarBeginSec <
      marginPxLeft / timeBarPxPerSec
    ) {
      setTimeBarBeginSec(
        currentTimeSecWithoutOffset - marginPxLeft / timeBarPxPerSec
      );
    } else if (
      currentTimeSecWithoutOffset - timeBarBeginSec >
      (timeBarWidth - marginPxRight) / timeBarPxPerSec
    ) {
      setTimeBarBeginSec(
        currentTimeSecWithoutOffset -
          (timeBarWidth - marginPxRight) / timeBarPxPerSec
      );
    }
  }, [currentTimeSecWithoutOffset, timeBarBeginSec, timeBarWidth]);

  const [timeBarBeginStep, setTimeBarBeginStep] = useState<number>(0);
  useEffect(() => {
    if (chart) {
      setCurrentStep(
        getStep(chart?.bpmChanges, currentTimeSecWithoutOffset - chart.offset)
      );
      setTimeBarBeginStep(
        getStep(chart?.bpmChanges, timeBarBeginSec - chart.offset)
      );
    }
  }, [chart, timeBarBeginSec, currentTimeSecWithoutOffset]);

  const [notesAll, setNotesAll] = useState<Note[]>([]);
  useEffect(() => {
    if (chart) {
      setNotesAll(loadChart(chart));
    }
  }, [chart]);

  // テキストボックス内の値
  // 実際のoffsetはchart.offset
  const [offset, setOffset] = useState<string>("");
  const offsetValid = (offset: string) =>
    !isNaN(Number(offset)) && Number(offset) >= 0;
  const changeOffset = (ofs: string) => {
    setOffset(ofs);
    if (chart && offsetValid(ofs)) {
      chart.offset = Number(ofs);
    }
  };

  // テキストボックス内の値
  // 実際のbpmはchart.bpmChanges
  const [bpm, setBpm] = useState<string>("");
  const bpmValid = (bpm: string) => !isNaN(Number(bpm)) && Number(bpm) >= 0;
  const changeBpm = (bpm: string) => {
    setBpm(bpm);
    if (chart && bpmValid(bpm)) {
      let bpmChangeIndex =
        chart.bpmChanges.findIndex((ch) => ch.step > currentStep) - 1;
      if (bpmChangeIndex < 0) {
        bpmChangeIndex = chart.bpmChanges.length - 1;
      }
      chart.bpmChanges[bpmChangeIndex].bpm = Number(bpm);
    }
  };
  const [bpmChangeHere, setBpmChangeHere] = useState<boolean>(true);
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
            <button
              className={
                "bg-gray-200 ml-1 p-1 border border-gray-600 rounded " +
                "hover:bg-gray-100 active:bg-gray-300 active:shadow-inner"
              }
              onClick={() => {
                if (ready) {
                  if (!playing) {
                    start();
                  } else {
                    stop();
                  }
                }
              }}
            >
              <span>{playing ? "Pause" : "Play"}</span>
              <Key className="text-xs ml-1 p-0.5">Space</Key>
            </button>
            <button
              className={
                "bg-gray-200 ml-1 p-1 border border-gray-600 rounded " +
                "hover:bg-gray-100 active:bg-gray-300 active:shadow-inner"
              }
              onClick={() => {
                if (ready) {
                  seekStepRel(-1);
                }
              }}
            >
              <span>-1 Step</span>
              <Key className="text-xs ml-1 p-0.5">←</Key>
            </button>
            <button
              className={
                "bg-gray-200 ml-1 p-1 border border-gray-600 rounded " +
                "hover:bg-gray-100 active:bg-gray-300 active:shadow-inner"
              }
              onClick={() => {
                if (ready) {
                  seekStepRel(1);
                }
              }}
            >
              <span>+1 Step</span>
              <Key className="text-xs ml-1 p-0.5">→</Key>
            </button>
          </div>
          <div
            className={"h-2 bg-gray-300 relative mt-12 mb-12 overflow-visible"}
            ref={timeBarRef}
          >
            {Array.from(
              new Array(Math.ceil(timeBarWidth / timeBarPxPerSec))
            ).map((_, dt) => (
              <span
                key={dt}
                className="absolute border-l border-gray-400"
                style={{
                  top: -20,
                  bottom: -4,
                  left: timeBarPos(Math.ceil(timeBarBeginSec) + dt),
                }}
              >
                {timeSecStr(Math.ceil(timeBarBeginSec) + dt)}
              </span>
            ))}
            {chart &&
              currentBpm &&
              Array.from(
                new Array(
                  Math.ceil(
                    timeBarWidth / (timeBarPxPerSec * (60 / currentBpm))
                  )
                )
              ).map((_, dt) => (
                <span
                  key={dt}
                  className="absolute border-l border-red-400 "
                  style={{
                    top: -4,
                    bottom: -20,
                    left: timeBarPos(
                      getTimeSec(
                        chart!.bpmChanges,
                        Math.ceil(timeBarBeginStep) + dt
                      ) + chart.offset
                    ),
                  }}
                >
                  <span className="absolute bottom-0">
                    {Math.ceil(timeBarBeginStep) + dt}
                  </span>
                </span>
              ))}
            {chart?.bpmChanges.map((ch, i) => (
              <span
                key={i}
                className="absolute "
                style={{
                  bottom: -40,
                  left: timeBarPos(getTimeSec(chart!.bpmChanges, ch.step)),
                }}
              >
                <span className="absolute bottom-0">{ch.bpm}</span>
              </span>
            ))}

            <div
              className="absolute border-l border-amber-400 shadow shadow-yellow-400"
              style={{
                top: -40,
                bottom: -20,
                left: timeBarPos(currentTimeSecWithoutOffset),
              }}
            />
            <span
              className="absolute "
              style={{
                top: -40,
                left: timeBarPos(currentTimeSecWithoutOffset),
              }}
            >
              {timeStr(currentTimeSecWithoutOffset)}
            </span>
            {chart &&
              notesAll.map(
                (n, i) =>
                  n.hitTimeSec + chart.offset > timeBarBeginSec &&
                  n.hitTimeSec + chart.offset <
                    timeBarBeginSec + timeBarWidth / timeBarPxPerSec && (
                    <span
                      key={n.id}
                      className={
                        "absolute w-3 h-3 rounded-full " +
                        (n.id === currentNoteIndex
                          ? "bg-red-400 "
                          : "bg-yellow-400 ")
                      }
                      style={{
                        top: -2,
                        left: timeBarPos(n.hitTimeSec + chart.offset) - 6,
                      }}
                    />
                  )
              )}
          </div>
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
              <input
                type="text"
                className={
                  "mx-1 px-1 font-main-ui text-base text-right " +
                  "border-0 border-b border-black bg-transparent " +
                  (!offsetValid(offset) ? "text-red-500 " : "")
                }
                value={offset}
                onChange={(e) => changeOffset(e.target.value)}
                size={6}
              />
              <span>s</span>
            </p>
            <p>
              <span>Current BPM:</span>
              <input
                type="text"
                className={
                  "mx-1 px-1 font-main-ui text-base text-right " +
                  "border-0 border-b border-black bg-transparent " +
                  (!bpmValid(bpm) ? "text-red-500 " : "")
                }
                value={bpm}
                onChange={(e) => changeBpm(e.target.value)}
                size={6}
              />
            </p>
            <p>
              <input
                className="ml-4 mr-1"
                type="checkbox"
                id="bpmChangeHere"
                checked={bpmChangeHere}
                onChange={toggleBpmChangeHere}
              />
              <label htmlFor="bpmChangeHere">
                <span>Change At</span>
                <span className="ml-2">{Math.round(currentStep)}</span>
              </label>
              <span className="ml-1">:</span>
              <input
                type="text"
                className={
                  "mx-1 px-1 font-main-ui text-base text-right " +
                  "border-0 border-b border-black bg-transparent " +
                  (!bpmValid(bpm) ? "text-red-500 " : "")
                }
                value={bpm}
                onChange={(e) => changeBpm(e.target.value)}
                size={6}
              />
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function timeStr(timeSec: number): string {
  if (timeSec < 0) {
    return "-" + timeStr(-timeSec);
  } else {
    return (
      Math.floor(timeSec / 60).toString() +
      ":" +
      (Math.floor(timeSec) % 60).toString().padStart(2, "0") +
      "." +
      (Math.floor(timeSec * 100) % 100).toString().padStart(2, "0")
    );
  }
}
function timeSecStr(timeSec: number): string {
  if (timeSec < 0) {
    return "-" + timeSecStr(-timeSec);
  } else {
    return ":" + (Math.floor(timeSec) % 60).toString().padStart(2, "0");
  }
}
