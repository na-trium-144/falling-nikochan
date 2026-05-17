import { useCallback, useEffect, useRef, useState } from "react";
import { useRealFPS } from "./common/fpsCalculator";
import FallingWindow from "./play/fallingWindow";
import { useFlash } from "./play/useFlash";
import useGameLogic from "./play/gameLogic";
import { ChartSeqData } from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import type { DemoChart } from "./topDemo.js";

export function TopDemo(
  props: { visible: boolean; bottom: number } & Partial<DemoChart>
) {
  const { realFps, stable: realFpsStable } = useRealFPS();
  const [runFps, setRunFps] = useState<number>(0);
  const [renderFps, setRenderFps] = useState<number>(0);
  const [showFps, setShowFps] = useState<boolean>(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("fps")) {
      setShowFps(true);
    }
  }, []);

  const { barFlash, flash } = useFlash();
  const currentTimeSec = useRef<number>(0);
  const prevTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  const getCurrentTimeSec = useCallback(() => {
    if (props.visible) {
      if (prevTimeStamp.current !== null) {
        currentTimeSec.current +=
          (performance.now() - prevTimeStamp.current) / 1000;
      }
    }
    prevTimeStamp.current = performance.now();
    return currentTimeSec.current;
  }, [props.visible]);
  const { notesAll, resetNotesAll } = useGameLogic(
    getCurrentTimeSec,
    true,
    false,
    0,
    false,
    () => undefined,
    1,
    () => undefined,
    flash
  );
  useEffect(() => {
    if (
      !notesAll.length &&
      props.cid &&
      props.lvIndex !== undefined &&
      props.offset !== undefined
    ) {
      fetch(
        process.env.BACKEND_PREFIX +
          `/api/seqFile/${props.cid}/${props.lvIndex}`
      ).then(
        (res) => {
          if (res.ok) {
            res.arrayBuffer().then((buf) => {
              const seq = msgpack.decode(buf) as ChartSeqData;
              resetNotesAll(
                seq.notes.map((n) => ({
                  ...n,
                  done: 0,
                  bigDone: false,
                })),
                props.offset! - seq.offset
              );
              currentTimeSec.current = props.offset! - seq.offset;
            });
          }
        },
        () => undefined
      );
    }
  }, [notesAll, resetNotesAll, props.cid, props.lvIndex, props.offset]);

  return (
    <>
      <FallingWindow
        blur
        className="absolute inset-0 isolate z-title-fw"
        style={{ bottom: props.bottom }}
        notes={notesAll}
        getCurrentTimeSec={getCurrentTimeSec}
        playing={true}
        setRunFPS={setRunFps}
        setRenderFPS={setRenderFps}
        barFlash={barFlash}
        noClear={false}
        playbackRate={1}
        shouldHideBPMSign={false}
        setShouldHideBPMSign={() => undefined}
        showTSOffset={false}
      />
      {showFps && (
        <span className="fixed left-3 bottom-3 isolate z-play-version">
          [{renderFps} / {runFps} / {Math.round(realFps)}
          {!realFpsStable && "?"} FPS]
        </span>
      )}
    </>
  );
}
