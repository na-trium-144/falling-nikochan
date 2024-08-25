"use client"; // あとでけす

import { useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow";
import { loadChart, Note } from "@/chartFormat/seq";
import { Chart, sampleChart } from "@/chartFormat/command";
import FlexYouTube from "./youtube";
import ScoreDisp from "./score";

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
    <main className="flex flex-row-reverse w-screen h-screen bg-sky-100">
      <div className="grow-0 shrink-0 basis-4/12 flex flex-col">
        <div className="m-3 p-3 bg-amber-700 rounded-lg flex flex-col">
          <FlexYouTube className="flex-none block" id={chart?.ytId} />
          <span className="flex-none font-title text-lg">{chart?.title}</span>
          <span className="flex-none font-title text-sm">
            by {chart?.author}
          </span>
        </div>
      </div>
      <div className="relative flex-1">
        <FallingWindow
          className="absolute inset-0"
          notes={notes}
          startDate={startDate}
        />
        <ScoreDisp className="absolute top-0 right-0 " score={score} best={0} />
      </div>
    </main>
  );
}
