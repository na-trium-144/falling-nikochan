"use client"; // あとでけす

import { useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow";
import { loadChart, Note } from "@/chartFormat/seq";
import { Chart, sampleChart } from "@/chartFormat/command";
import FlexYouTube from "./youtube";
import ScoreDisp from "./score";
import RhythmicalSlime from "./rhythmicalSlime";

export default function Home() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  useEffect(() => {
    // テスト用
    setChart(sampleChart);
  }, []);
  useEffect(() => {
    if (chart) {
      setNotes(loadChart(chart));
      setStartDate(new Date());
    }
  }, [chart]);
  const score = 100;

  return (
    <main
      className={
        "flex flex-col w-screen h-screen overflow-hidden " +
        "bg-gradient-to-t from-white to-sky-200 "
      }
    >
      <div className="flex-1 w-full flex flex-row-reverse ">
        <div className="basis-4/12 flex flex-col">
          <div className="m-3 p-3 bg-amber-700 rounded-lg flex flex-col">
            <FlexYouTube className="flex-none block" id={chart?.ytId} />
            <span className="flex-none font-title text-lg">{chart?.title}</span>
            <span className="flex-none font-title text-sm">
              by {chart?.author}
            </span>
          </div>
        </div>
        <div className="basis-8/12 relative">
          <FallingWindow
            className="absolute inset-0"
            notes={notes}
            startDate={startDate}
          />
          <ScoreDisp
            className="absolute top-0 right-0 "
            score={score}
            best={0}
          />
        </div>
      </div>
      <div className="relative w-full h-16">
        <div
          className={
            "absolute inset-x-0 bottom-0 " +
            "bg-gradient-to-t from-lime-600 via-lime-500 to-lime-200 "
          }
          style={{ top: -15 }}
        />
        <RhythmicalSlime
          className="absolute "
          style={{ bottom: "100%", right: 15 }}
          num={4}
          startDate={startDate}
          bpmChanges={chart?.bpmChanges}
        />
      </div>
    </main>
  );
}
