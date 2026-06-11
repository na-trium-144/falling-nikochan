import { useCallback, useEffect, useRef, useState } from "react";
import { useRealFPS } from "./common/fpsCalculator";
import FallingWindow from "./play/fallingWindow";
import { useFlash } from "./play/useFlash";
import useGameLogic from "./play/gameLogic";
import {
  ChartBrief,
  currentChartVer,
  Level15Play,
  Level6Play,
  loadChart,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { useColorThief } from "./common/colorThief";
import clsx from "clsx/lite";
import { ChartListItem } from "./main/chartList";
import { fetchBackend } from "./common/fetch";
import { fetchBrief } from "./common/briefCache";

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
      fetchBackend()
        .get(`/api/playFile/${props.cid}/${props.lvIndex}`)
        .arrayBuffer((buf) => {
          currentChartVer satisfies 16; // update the code below when chart version is bumped
          const playFile = msgpack.decode(buf) as Level6Play | Level15Play;
          if (
            playFile.ver === 6 ||
            playFile.ver === 15 ||
            playFile.ver === 16
          ) {
            const seq = loadChart(playFile);
            resetNotesAll(
              seq.notes.map((n) => ({
                ...n,
                done: 0,
                bigDone: false,
              })),
              props.offset! - seq.offset
            );
            currentTimeSec.current = props.offset! - seq.offset;
          } else {
            // ignore
          }
        });
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

export function DemoDetail(
  props: {
    onClick: (cid: string, brief?: ChartBrief) => void;
    onClickMobile: (cid: string, brief: ChartBrief | undefined) => void;
  } & Partial<DemoChart>
) {
  const [brief, setBrief] = useState<ChartBrief>();
  useEffect(() => {
    if (!brief && props.cid) {
      fetchBrief(props.cid, {
        onResult: (brief) => setBrief(brief),
      });
    }
  }, [brief, props.cid]);

  const colorThief = useColorThief();

  const [show, setShow] = useState<boolean>(false);
  const initTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  useEffect(() => {
    if (props.cid && props.lvIndex !== undefined) {
      if (initTimeStamp.current === null) {
        initTimeStamp.current = performance.now();
      }
      if (brief) {
        setTimeout(
          () => setShow(true),
          Math.max(0, initTimeStamp.current + 500 - performance.now())
        );
      }
    }
  }, [props.cid, props.lvIndex, brief]);

  return (
    <>
      <ul
        className={clsx(
          "hidden demo-wide:grid",
          "fn-chart-list fn-cl-big-v w-(--item-max-width)",
          "transition-[translate,opacity] duration-1000 ease-out",
          show ? "" : "opacity-0 translate-y-1"
        )}
      >
        <ChartListItem
          className={colorThief.boxStyle}
          style={{ color: colorThief.currentColor }}
          cid={props.cid ?? ""}
          brief={brief}
          href={`/share/${props.cid}`}
          onClick={() => props.onClick(props.cid!, brief)}
          onClickMobile={() => props.onClickMobile(props.cid!, brief)}
          badge
          big="v"
          noDefaultColor
        />
      </ul>
      <ul
        className={clsx(
          "demo-wide:hidden",
          "fn-chart-list fn-cl-big-h w-[min(var(--item-max-width),var(--item-min-width))] max-w-full",
          "transition-[translate,opacity] duration-1000 ease-out",
          show ? "" : "opacity-0 translate-y-1"
        )}
      >
        <ChartListItem
          className={colorThief.boxStyle}
          style={{ color: colorThief.currentColor }}
          cid={props.cid ?? ""}
          brief={brief}
          href={`/share/${props.cid}`}
          onClick={() => props.onClick(props.cid!, brief)}
          onClickMobile={() => props.onClickMobile(props.cid!, brief)}
          badge
          big="h"
          noDefaultColor
        />
      </ul>
      {brief?.ytId && (
        <img
          ref={colorThief.imgRef}
          className="hidden"
          src={`https://i.ytimg.com/vi/${brief?.ytId}/mqdefault.jpg`}
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}
