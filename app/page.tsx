"use client"; // あとでけす

import { useEffect, useRef, useState } from "react";
import { Pos, Note, DisplayNote, loadChart } from "@/chartFormat/seq";
import { sampleChart } from "@/chartFormat/command";

export default function Home() {
  const notes = useRef<Note[]>([]);
  useEffect(() => {
    // テスト用
    notes.current = loadChart(sampleChart);
  }, []);
  const startDate = useRef<Date>(new Date());
  const divRef = useRef<HTMLDivElement>(null);
  const [divWidth, setDivWidth] = useState<number>(0);
  const [divHeight, setDivHeight] = useState<number>(0);
  const [displayNotes, setDisplayNotes] = useState<DisplayNote[]>([]);
  useEffect(() => {
    const i = setInterval(() => {
      if (!divRef.current) {
        return;
      }
      if (divWidth != divRef.current.clientWidth) {
        setDivWidth(divRef.current.clientWidth);
      }
      if (divHeight != divRef.current.clientHeight) {
        setDivHeight(divRef.current.clientHeight);
      }
      const now = (new Date().getTime() - startDate.current.getTime()) / 1000;
      setDisplayNotes(
        notes.current.map((n) => n.display(now)).filter((n) => n !== null)
      );
    }, 10);
    return () => clearInterval(i);
  }, [divWidth, divHeight]);

  return (
    <main className="w-screen h-screen">
      <div ref={divRef} className="absolute w-full h-full">
        {displayNotes.map((d) => (
          <span
            key={d.id}
            className="absolute bg-yellow-500 rounded-full w-8 h-8"
            style={{
              left: d.pos.x * divWidth,
              bottom: d.pos.y * divHeight,
            }}
          ></span>
        ))}
      </div>
    </main>
  );
}
