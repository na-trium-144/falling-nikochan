"use client";

import { useEffect, useRef, useState } from "react";
import { Note, DisplayNote, noteSize, targetY } from "@/chartFormat/seq";
import { useResizeDetector } from "react-resize-detector";

interface Props {
  className?: string;
  style?: object;
  notes: Note[];
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  setFPS?: (fps: number) => void;
}

export default function FallingWindow(props: Props) {
  const { notes, playing, getCurrentTimeSec, setFPS } = props;
  const [displayNotes, setDisplayNotes] = useState<DisplayNote[]>([]);
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;
  const fpsCount = useRef<number>(0);
  const fpsCountBegin = useRef<Date>(new Date());

  useEffect(() => {
    const i = setInterval(() => {
      const now = getCurrentTimeSec();
      if (
        playing &&
        marginX !== undefined &&
        marginY !== undefined &&
        boxSize &&
        now !== undefined
      ) {
        setDisplayNotes(
          notes
            .map((n) =>
              n.display(
                now,
                n,
                [-marginX / boxSize, 1 + marginX / boxSize],
                [-marginY / boxSize, 1 + marginY / boxSize]
              )
            )
            .filter((n) => n !== null)
        );
      } else {
        setDisplayNotes([]);
      }

      fpsCount.current++;
      if(new Date().getTime() - fpsCountBegin.current.getTime() >= 1000){
        setFPS && setFPS(fpsCount.current);
        fpsCountBegin.current = new Date();
        fpsCount.current = 0;
      }
    }, 10);
    return () => clearInterval(i);
  }, [notes, playing, getCurrentTimeSec, marginX, marginY, boxSize, setFPS]);

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
              <div
                key={d.id}
                className="absolute "
                style={{
                  width: noteSize * boxSize,
                  height: noteSize * boxSize,
                  left: (d.pos.x - noteSize / 2) * boxSize + marginX,
                  bottom:
                    (d.pos.y + targetY - noteSize / 2) * boxSize + marginY,
                }}
              >
                {d.done === 0 ? (
                  <img src="/nikochan0.svg" className="w-full h-full " />
                ) : d.done === 1 ? (
                  <img
                    src="/nikochan1.svg"
                    className={
                      "w-full h-full transition ease-linear " +
                      "duration-300 -translate-y-4 opacity-0 scale-125"
                    }
                  />
                ) : d.done === 2 ? (
                  <img
                    src="/nikochan2.svg"
                    className={
                      "w-full h-full transition ease-linear " +
                      "duration-300 -translate-y-2 opacity-0"
                    }
                  />
                ) : d.done === 3 ? (
                  <img
                    src="/nikochan3.svg"
                    className={
                      "w-full h-full transition ease-linear " +
                      "duration-300 opacity-0"
                    }
                  />
                ) : (
                  <img src="/nikochan0.svg" className="w-full h-full " />
                )}
              </div>
            )
        )}
      </div>
    </div>
  );
}
