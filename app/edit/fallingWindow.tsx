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

  const displayNotes: { current: DisplayNote; history: DisplayNote[] }[] = [];
  if (
    marginX !== undefined &&
    marginY !== undefined &&
    boxSize &&
    currentTimeSec !== undefined
  ) {
    for (let ni = 0; ni < notes.length; ni++) {
      const dn = {
        current: notes[ni].display(
          currentTimeSec,
          notes[ni],
          [-marginX / boxSize, 1 + marginX / boxSize],
          [-marginY / boxSize, 1 + marginY / boxSize]
        ),
        history: [] as DisplayNote[],
      };
      if (dn.current !== null) {
        for (let dt = 0; dt < 5; dt += 0.3) {
          const dn2 = notes[ni].display(
            currentTimeSec + dt,
            notes[ni],
            [-marginX / boxSize, 1 + marginX / boxSize],
            [-marginY / boxSize, 1 + marginY / boxSize]
          );
          if (dn2 !== null) {
            dn.history.push(dn2);
          } else {
            break;
          }
        }
        for (let dt = 0; dt < 5; dt += 0.3) {
          const dn2 = notes[ni].display(
            currentTimeSec - dt,
            notes[ni],
            [-marginX / boxSize, 1 + marginX / boxSize],
            [-marginY / boxSize, 1 + marginY / boxSize]
          );
          if (dn2 !== null) {
            dn.history.unshift(dn2);
          } else {
            break;
          }
        }
        displayNotes.push({ current: dn.current, history: dn.history });
      }
    }
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
              <>
                <div
                  key={d.current.id}
                  className={"absolute "}
                  style={{
                    width: noteSize * boxSize,
                    height: noteSize * boxSize,
                    left: (d.current.pos.x - noteSize / 2) * boxSize + marginX,
                    bottom:
                      (d.current.pos.y + targetY - noteSize / 2) * boxSize +
                      marginY,
                  }}
                >
                  <img src={`/nikochan0.svg`} className="w-full h-full " />
                </div>
                {d.history.slice(1).map((_, di) => (
                  <span
                    key={di}
                    className="absolute border-b border-gray-400 origin-bottom-left"
                    style={{
                      width:
                        Math.sqrt(
                          Math.pow(
                            d.history[di].pos.x - d.history[di + 1].pos.x,
                            2
                          ) +
                            Math.pow(
                              d.history[di].pos.y - d.history[di + 1].pos.y,
                              2
                            )
                        ) * boxSize,
                      left: d.history[di].pos.x * boxSize + marginX,
                      bottom:
                        (d.history[di].pos.y + targetY) * boxSize + marginY,
                      transform: `rotate(${-Math.atan2(
                        d.history[di + 1].pos.y - d.history[di].pos.y,
                        d.history[di + 1].pos.x - d.history[di].pos.x
                      )}rad)`,
                    }}
                  />
                ))}
              </>
            )
        )}
      </div>
    </div>
  );
}
