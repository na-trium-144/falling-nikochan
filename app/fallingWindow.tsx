"use client";

import { useEffect, useState } from "react";
import { Note, DisplayNote, noteSize, targetY } from "@/chartFormat/seq";
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
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;

  useEffect(() => {
    const i = setInterval(() => {
      if (
        startDate != null &&
        marginX !== undefined &&
        marginY !== undefined &&
        boxSize
      ) {
        const now = (new Date().getTime() - startDate.getTime()) / 1000;
        setDisplayNotes(
          notes
            .map((n) =>
              n.display(
                now,
                [-marginX / boxSize, 1 + marginX / boxSize],
                [-marginY / boxSize, 1 + marginY / boxSize]
              )
            )
            .filter((n) => n !== null)
        );
      } else {
        setDisplayNotes([]);
      }
    }, 10);
    return () => clearInterval(i);
  }, [notes, startDate, marginX, marginY, boxSize]);

  return (
    <div className={props.className} style={props.style} ref={ref}>
      <div className="relative w-full h-full overflow-visible">
        {boxSize && marginY !== undefined && (
          <div
            className="absolute border-b-2 border-gray-400"
            style={{
              left: 0,
              right: "-100%",
              bottom: targetY * boxSize + marginY,
            }}
          />
        )}
        {displayNotes.map(
          (d) =>
            boxSize &&
            marginX !== undefined &&
            marginY !== undefined && (
              <span
                key={d.id}
                className="absolute bg-yellow-500 rounded-full"
                style={{
                  width: noteSize * boxSize,
                  height: noteSize * boxSize,
                  left: (d.pos.x - noteSize / 2) * boxSize + marginX,
                  bottom:
                    (d.pos.y + targetY - noteSize / 2) * boxSize + marginY,
                }}
              />
            )
        )}
      </div>
    </div>
  );
}
