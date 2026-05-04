import { useCallback, useEffect, useRef, useState } from "react";
import { useRealFPS } from "./common/fpsCalculator";
import FallingWindow from "./play/fallingWindow";
import { useFlash } from "./play/useFlash";
import useGameLogic from "./play/gameLogic";
import { ChartBrief, ChartSeqData } from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { useColorThief } from "./common/colorThief";
import clsx from "clsx/lite";
import { ButtonHighlight } from "./common/button";

export interface DemoChart {
  cid: string;
  lvIndex: number;
  offset: number;
}
export const demoCharts: DemoChart[] = (
  process.env.NODE_ENV === "development"
    ? ([["102399", 0, 4.5]] as const)
    : ([
        ["850858", 1, 11.3], // bad apple!! single-7
        ["596134", 0, 8.1], // lagtrain single-3
        ["170465", 1, 0], // tetoris double-7
        ["592994", 0, 38.3], // phony single-4
        ["488006", 0, 15.4], // megalovania single-5
        ["142383", 0, 10.8], // night of nights single-6
        ["683932", 1, 10.5], // conflict double-9
        ["768743", 0, 46.4], // freedom dive single-8
      ] as const)
).map(([cid, lvIndex, offset]) => ({ cid, lvIndex, offset }));

export function TopDemo(props: { visible: boolean } & Partial<DemoChart>) {
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
      )
        .then((res) => res.arrayBuffer())
        .then((buf) => {
          const seq = msgpack.decode(buf) as ChartSeqData;
          resetNotesAll(
            seq.notes.map((n) => ({
              ...n,
              done: 0,
              bigDone: false,
            })),
            props.offset!
          );
          currentTimeSec.current = props.offset!;
        });
    }
  }, [notesAll, resetNotesAll, props.cid, props.lvIndex, props.offset]);

  return (
    <>
      <FallingWindow
        blur
        className="absolute inset-0 isolate z-title-fw"
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

export function DemoDetail(
  props: {
    onClick: (cid: string, brief?: ChartBrief) => void;
    onClickMobile: (cid: string, brief: ChartBrief | undefined) => void;
  } & Partial<DemoChart>
) {
  const [brief, setBrief] = useState<ChartBrief>();
  useEffect(() => {
    if (!brief && props.cid) {
      fetch(process.env.BACKEND_PREFIX + `/api/brief/${props.cid}`)
        .then((res) => res.json())
        .then((brief: ChartBrief) => setBrief(brief));
    }
  }, [brief, props.cid]);

  const colorThief = useColorThief();

  const [show, setShow] = useState<boolean>(false);
  useEffect(() => {
    if (props.cid && props.lvIndex !== undefined && brief) {
      setTimeout(() => setShow(true), 500);
    }
  }, [props.cid, props.lvIndex, brief]);

  return (
    <>
      <a
        href={`/share/${props.cid}`}
        onClick={(e) => {
          props.onClick(props.cid!, brief);
          e.preventDefault();
        }}
        className={clsx(
          "no-mobile w-80",
          "rounded-sq-xl p-3",
          "relative flex flex-col",
          "fn-flat-button",
          colorThief.boxStyle,
          "transition-[translate,opacity] duration-1000 ease-out",
          show ? "" : "opacity-0 translate-y-1"
        )}
        style={{ color: colorThief.currentColor }}
      >
        <span className="fn-glass-1" />
        <span className="fn-glass-2" />
        <ButtonHighlight />
        {props.cid && props.lvIndex !== undefined && brief && (
          <div
            className={clsx(
              "flex flex-col",
              "*:max-w-full *:text-ellipsis *:whitespace-nowrap"
            )}
          >
            <img
              ref={colorThief.imgRef}
              src={`https://i.ytimg.com/vi/${brief.ytId}/mqdefault.jpg`}
              crossOrigin="anonymous"
              className="mb-2"
            />
            <p className="text-xs/4 text-dim">{props.cid}</p>
            <p className="h-6 font-title text-lg/6 font-medium fg-bright">
              {brief.title}
            </p>
            <p className="h-6 font-title text-lg/6 fg-bright">
              {brief.composer}
            </p>
            <p className="h-5 text-base/5">
              {brief.levels[props.lvIndex].name && (
                <span className="font-title mr-[0.25em]">
                  {brief.levels[props.lvIndex].name}
                </span>
              )}
              <span
                className={clsx(
                  "fn-level-type",
                  brief.levels[props.lvIndex].type
                )}
              >
                <span>{brief.levels[props.lvIndex].type}-</span>
                <span>{brief.levels[props.lvIndex].difficulty}</span>
              </span>
            </p>
          </div>
        )}
      </a>
      <a
        href={`/share/${props.cid}`}
        onClick={(e) => {
          props.onClickMobile(props.cid!, brief);
          e.preventDefault();
        }}
        className={clsx(
          "no-pc w-80",
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
        {props.cid && props.lvIndex !== undefined && brief && (
          <div className="flex flex-col">
            <img
              src={`https://i.ytimg.com/vi/${brief.ytId}/mqdefault.jpg`}
              crossOrigin="anonymous"
            />
          </div>
        )}
      </a>
    </>
  );
}
