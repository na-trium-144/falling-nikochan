import { useCallback, useEffect, useRef, useState } from "react";
import { useRealFPS } from "./common/fpsCalculator";
import FallingWindow from "./play/fallingWindow";
import { useFlash } from "./play/useFlash";
import useGameLogic from "./play/gameLogic";
import { ChartBrief, ChartSeqData } from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { useColorThief } from "./common/colorThief";
import clsx from "clsx/lite";
import Link from "next/link";
import { ButtonHighlight } from "./common/button";

export function TopDemo(props: { visible: boolean }) {
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
    if (!notesAll.length) {
      fetch(process.env.BACKEND_PREFIX + `/api/seqFile/102399/0`)
        .then((res) => res.arrayBuffer())
        .then((buf) => {
          const seq = msgpack.decode(buf) as ChartSeqData;
          resetNotesAll(
            seq.notes.map((n) => ({
              ...n,
              done: 0,
              bigDone: false,
            })),
            -Infinity
          );
          currentTimeSec.current = 0;
        });
    }
  }, [notesAll, resetNotesAll]);

  return (
    <>
      <FallingWindow
        className="absolute inset-0 blur-2xs isolate z-title-fw"
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

export function DemoDetail() {
  const [brief, setBrief] = useState<ChartBrief>();
  useEffect(() => {
    if (!brief) {
      fetch(process.env.BACKEND_PREFIX + `/api/brief/102399`)
        .then((res) => res.json())
        .then((brief: ChartBrief) => setBrief(brief));
    }
  }, [brief]);

  const colorThief = useColorThief();

  return (
    <Link
      href={`/share/foo`}
      className={clsx(
        "w-96",
        "rounded-sq-xl p-3",
        "relative flex flex-col",
        "fn-flat-button",
        colorThief.boxStyle
      )}
      style={{ color: colorThief.currentColor }}
    >
      <span className="fn-glass-1" />
      <span className="fn-glass-2" />
      <ButtonHighlight />
      <div className="flex flex-row-reverse main-wide:flex-col">
        {brief?.ytId && (
          <img
            ref={colorThief.imgRef}
            src={`https://i.ytimg.com/vi/${brief?.ytId}/mqdefault.jpg`}
            crossOrigin="anonymous"
          />
        )}
      </div>
    </Link>
  );
}
