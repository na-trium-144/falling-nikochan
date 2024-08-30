"use client";

import { useEffect, useRef, useState } from "react";
import { Note, DisplayNote, noteSize, targetY } from "@/chartFormat/seq";
import { useResizeDetector } from "react-resize-detector";

interface Props {
  className?: string;
  style?: object;
  notes: Note[];
  currentTimeSec: number;
}

export default function FallingWindow(props: Props) {
  const { notes, currentTimeSec } = props;
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;

  let displayNotes: DisplayNote[] = [];
  if (
    marginX !== undefined &&
    marginY !== undefined &&
    boxSize &&
    currentTimeSec !== undefined
  ) {
    displayNotes = notes
      .map((n) =>
        n.display(
          currentTimeSec,
          n,
          [-marginX / boxSize, 1 + marginX / boxSize],
          [-marginY / boxSize, 1 + marginY / boxSize]
        )
      )
      .filter((n) => n !== null);
  }

  return (
    <div className={props.className} style={props.style} ref={ref}>
      <div className="relative w-full h-full overflow-visible">
        {boxSize && marginY !== undefined && (
          <div
            className={
              "absolute h-0.5 transition duration-100 " +
              "bg-gray-400 shadow-none"
            }
            style={{
              left: 0,
              right: 0,
              bottom: targetY * boxSize + marginY,
            }}
          />
        )}
        {displayNotes.map(
          (d) =>
            boxSize &&
            marginX !== undefined &&
            marginY !== undefined && (
              <div
                key={d.id}
                className={"absolute "}
                style={{
                  width: noteSize * boxSize,
                  height: noteSize * boxSize,
                  left: (d.pos.x - noteSize / 2) * boxSize + marginX,
                  bottom:
                    (d.pos.y + targetY - noteSize / 2) * boxSize + marginY,
                }}
              >
                <img src={`/nikochan0.svg`} className="w-full h-full " />
              </div>
            )
        )}
      </div>
    </div>
  );
}
