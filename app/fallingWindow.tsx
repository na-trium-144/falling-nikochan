"use client";

import { useEffect, useRef, useState } from "react";
import { Pos, Note, DisplayNote, noteSize } from "@/chartFormat/seq";
import { useResizeDetector } from "react-resize-detector";

interface Props {
  className?: string;
  style?: object;
  notes: Note[];
  startDate: Date | null;
}

export default function FallingWindow(props: Props) {
  const { notes, startDate } = props;
  const [displayNotes, setDisplayNotes] = useState<DisplayNote[]>([]);
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);

  useEffect(() => {
    const i = setInterval(() => {
      if (startDate != null) {
        const now = (new Date().getTime() - startDate.getTime()) / 1000;
        setDisplayNotes(
          notes.map((n) => n.display(now)).filter((n) => n !== null)
        );
      } else {
        setDisplayNotes([]);
      }
    }, 10);
    return () => clearInterval(i);
  }, [notes, startDate]);

  return (
    <div className={props.className} style={props.style}>
      <div className="absolute w-full h-full top-0 left-0 overflow-hidden">
        {displayNotes.map(
          (d) =>
            boxSize && (
              <span
                key={d.id}
                className="absolute bg-yellow-500 rounded-full"
                style={{
                  width: noteSize * boxSize,
                  height: noteSize * boxSize,
                  left: (d.pos.x - noteSize / 2) * boxSize,
                  bottom: (d.pos.y - noteSize / 2) * boxSize,
                }}
              />
            )
        )}
      </div>
    </div>
  );
}
