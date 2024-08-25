"use client"; // あとでけす

import { useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow";
import { loadChart, Note } from "@/chartFormat/seq";
import { sampleChart } from "@/chartFormat/command";
import FlexYouTube from "./youtube";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  useEffect(() => {
    // テスト用
    setNotes(loadChart(sampleChart));
    setStartDate(new Date());
  }, []);

  return (
    <main className="flex flex-row w-screen h-screen">
      <FlexYouTube className="flex-1 overflow-hidden" />
      <FallingWindow className="flex-none " style={{ aspectRatio: 1 }} notes={notes} startDate={startDate} />
    </main>
  );
}
