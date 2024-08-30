"use client";

import { Chart, sampleChart } from "@/chartFormat/command";
import FlexYouTube from "@/youtube";
import { YouTubePlayer } from "@/youtubePlayer";
import { useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow";
import { getTimeSec, Note } from "@/chartFormat/seq";
import { useResizeDetector } from "react-resize-detector";

export default function Page() {
  const ytPlayer = useRef<YouTubePlayer | null>(null);
  const [chart, setChart] = useState<Chart | null>(null);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  useEffect(() => {
    // テスト用
    const ch = sampleChart();
    setChart(ch);
    setOffset(ch.offset.toString());
    setBpm(ch.bpmChanges[0].bpm.toString());
  }, []);

  const timeBarResize = useResizeDetector();
  const timeBarWidth = timeBarResize.width;
  const timeBarRef = timeBarResize.ref;
  const [timeBarBeginSec, setTimeBarBeginSec] = useState<number>(-1);
  const timeBarPos = (timeSec: number) =>
    ((timeSec - timeBarBeginSec) * (timeBarWidth || 500)) / 2.5;

  const [notesAll, setNotesAll] = useState<Note[]>([]);

  const [offset, setOffset] = useState<string>("");
  const offsetValid = (offset: string) =>
    !isNaN(Number(offset)) && Number(offset) >= 0;
  const changeOffset = (ofs: string) => {
    setOffset(ofs);
    if (chart && offsetValid(ofs)) {
      chart.offset = Number(ofs);
    }
  };
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
    <main className="w-screen min-h-screen overflow-x-hidden ">
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
              id={chart?.ytId}
              ytPlayer={ytPlayer}
            />
          </div>
          <div className={"relative flex-1 basis-8/12 "}>
            <FallingWindow
              className="absolute inset-0"
              notes={notesAll}
              currentTimeSec={currentTimeSec || 0}
            />
          </div>
        </div>
        <div className="flex-1 p-3 flex flex-col items-stretch">
          <div
            className={"h-2 bg-gray-300 relative mt-12 mb-12"}
            ref={timeBarRef}
          >
            {[0, 1, 2].map((dt) => (
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
            <span
              className="absolute "
              style={{
                top: -40,
                left: timeBarPos(currentTimeSec),
              }}
            >
              {timeStr(currentTimeSec)}
            </span>
            {chart &&
              [0, 1, 2, 3].map((dt) => (
                <span
                  key={dt}
                  className="absolute border-l border-red-400 "
                  style={{
                    top: -4,
                    bottom: -20,
                    left: timeBarPos(
                      getTimeSec(
                        chart!.bpmChanges,
                        Math.floor(currentStep) + dt
                      )
                    ),
                  }}
                >
                  <span className="absolute bottom-0">
                    {Math.floor(currentStep) + dt}
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
                left: timeBarPos(currentTimeSec),
              }}
            />
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
                <span className="ml-2">{timeStr(currentTimeSec / 60)}</span>
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
