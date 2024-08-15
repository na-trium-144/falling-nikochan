"use client"; // あとでけす

import { useEffect, useRef, useState } from "react";

// x, y: 0〜1
interface Pos {
  x: number;
  y: number;
}
interface NoteTrace {
  time: Date;
  pos: Pos;
}
class Note {
  id: number;
  hitTime: Date;
  // traceは時刻順に並んでいる (前が早い)
  trace: NoteTrace[];
  constructor(id: number, hitTime: Date, trace: NoteTrace[]) {
    this.id = id;
    this.hitTime = hitTime;
    this.trace = trace;
  }
  display(time: Date): DisplayNote | null {
    const i = this.trace.findIndex((tr) => tr.time.getTime() <= time.getTime());
    if (i < 0 || i + 1 >= this.trace.length) {
      return null;
    }
    const prevTrace = this.trace[i];
    const afterTrace = this.trace[i + 1];
    const interp =
      (time.getTime() - prevTrace.time.getTime()) /
      (afterTrace.time.getTime() - prevTrace.time.getTime());
    return {
      id: this.id,
      pos: {
        x: prevTrace.pos.x + (afterTrace.pos.x - prevTrace.pos.x) * interp,
        y: prevTrace.pos.y + (afterTrace.pos.y - prevTrace.pos.y) * interp,
      },
    };
  }
}
interface DisplayNote {
  id: number;
  pos: Pos;
}

export default function Home() {
  const notes = useRef<Note[]>([
    new Note(0, new Date(), [
      { time: new Date(2000, 1, 1), pos: { x: 0, y: 1 } },
      { time: new Date(2100, 1, 1), pos: { x: 0, y: 0 } },
    ]),
  ]);
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
      const now = new Date();
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
