import { ChartBrief, levelTypes } from "@falling-nikochan/chart";
import { levelBgColors } from "@/common/levelColors";
import ProgressBar from "@/common/progressBar.js";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import { useDisplayMode } from "@/scale.js";
import { useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { SmilingFace, VolumeNotice, Youtube } from "@icon-park/react";
import { linkStyle1 } from "@/common/linkStyle";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

interface Props {
  ready: boolean;
  playing: boolean;
  className?: string;
  lvType: string;
  lvIndex?: number;
  isMobile: boolean; // 横並び or 縦並び
  ytPlayer: { current?: YouTubePlayer };
  chartBrief?: ChartBrief;
  offset: number;
  onReady: () => void;
  onStart: () => void;
  onStop: () => void;
  onError: (ec: number) => void;
  ytVolume: number;
  setYtVolume: (vol: number) => void;
  enableSE: boolean;
  seVolume: number;
  setSEVolume: (vol: number) => void;
}
export function MusicArea(props: Props) {
  const { width, height, ref } = useResizeDetector();
  const { rem } = useDisplayMode();
  const ytHalf = width && width / 2 < 200;
  const largeTitle = props.isMobile ? height && height > 8 * rem : true;

  const [volumeCtrlOpen, setVolumeCtrlOpen] = useState(false);
  const [pointerInVolumeCtrl, setPointerInVolumeCtrl] = useState(false);
  const initialVolumeCtrlOpenDone = useRef(false);
  useEffect(() => {
    if (props.ready && !initialVolumeCtrlOpenDone.current) {
      const t = setTimeout(() => {
        setVolumeCtrlOpen(true);
        initialVolumeCtrlOpenDone.current = true;
      }, 500);
      return () => clearTimeout(t);
    }
  }, [props.ready]);
  useEffect(() => {
    if (props.playing && volumeCtrlOpen && !pointerInVolumeCtrl) {
      const t = setTimeout(() => {
        setVolumeCtrlOpen(false);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [props.playing, volumeCtrlOpen, pointerInVolumeCtrl]);

  const [currentSec, setCurrentSec] = useState<number>(0);
  const levelLength =
    props.chartBrief &&
    props.lvIndex !== undefined &&
    props.chartBrief.levels[props.lvIndex]
      ? Math.max(
          0.1,
          props.chartBrief.levels[props.lvIndex].length + props.offset,
        )
      : 0.1;
  useEffect(() => {
    const id = setInterval(() => {
      if (props.ytPlayer.current?.getCurrentTime) {
        setCurrentSec(props.ytPlayer.current.getCurrentTime() || 0);
      }
    }, 50);
    return () => clearInterval(id);
  }, [props]);

  return (
    <div
      className={
        "z-10 grow-0 shrink-0 pb-1 flex " +
        (levelBgColors.at(levelTypes.indexOf(props.lvType)) ||
          levelBgColors[1]) +
        (props.isMobile ? "rounded-b-lg " : "rounded-bl-xl pl-3 ") +
        "relative flex-col " +
        props.className
      }
      onPointerEnter={() => setPointerInVolumeCtrl(true)}
      onPointerLeave={() => setPointerInVolumeCtrl(false)}
      ref={ref}
    >
      <div
        className={
          "flex " + (props.isMobile ? "flex-row-reverse " : "flex-col ")
        }
      >
        {width && (
          <FlexYouTube
            fixedSide="width"
            className={
              "z-10 " +
              (props.isMobile ? "grow-0 shrink-0 w-1/2 mb-1.5 " : "w-full mb-1")
            }
            scale={ytHalf ? 0.5 : 1}
            id={props.chartBrief?.ytId}
            control={false}
            ytPlayer={props.ytPlayer}
            onReady={props.onReady}
            onStart={props.onStart}
            onStop={props.onStop}
            onError={props.onError}
          />
        )}
        <div
          className={
            "flex-1 min-w-0 mr-1 flex flex-col justify-between " +
            (props.isMobile ? "ml-3 mt-2 " : "")
          }
        >
          <div className={props.isMobile ? "h-0 overflow-visible " : ""}>
            <p className={largeTitle ? "leading-5 " : "leading-3.5 "}>
              {/* x-hiddenとy-visibleを組み合わせることはできないが、clipならok? */}
              <span
                className={
                  "inline-block font-title align-bottom " +
                  (largeTitle ? "text-2xl/6 " : "text-lg/5 ") +
                  "overflow-x-clip overflow-y-visible " +
                  "max-w-full text-ellipsis text-nowrap "
                }
              >
                {props.chartBrief?.title}
              </span>
              {props.chartBrief?.composer && (
                <span
                  className={
                    "inline-block font-title align-bottom " +
                    (largeTitle ? "text-lg/5 " : "text-sm/3.5 ") +
                    "overflow-x-clip overflow-y-visible " +
                    "max-w-full text-ellipsis text-nowrap "
                  }
                >
                  <span className="mx-1">/</span>
                  {props.chartBrief?.composer}
                </span>
              )}
            </p>
            <p className={largeTitle ? "leading-4.5 " : "leading-4 "}>
              {props.lvIndex !== undefined &&
                props.chartBrief?.levels[props.lvIndex] && (
                  <span
                    className={
                      "inline-block leading-0 align-bottom " +
                      "overflow-x-clip overflow-y-visible " +
                      "max-w-full text-ellipsis text-nowrap "
                    }
                  >
                    {props.chartBrief?.levels[props.lvIndex].name && (
                      <span
                        className={
                          "font-title mr-1 align-bottom " +
                          (largeTitle ? "text-lg/4 " : "text-sm/3.5 ")
                        }
                      >
                        {props.chartBrief?.levels[props.lvIndex].name}
                      </span>
                    )}
                    <span
                      className={
                        "align-bottom " +
                        (largeTitle ? "text-base/3 " : "text-xs/2.5 ")
                      }
                    >
                      {props.lvType}-
                    </span>
                    <span
                      className={
                        "align-bottom " +
                        (largeTitle ? "text-xl/4 " : "text-lg/3.5 ")
                      }
                    >
                      {props.chartBrief?.levels[props.lvIndex]?.difficulty}
                    </span>
                  </span>
                )}
              <span
                className={
                  "inline-block align-bottom " +
                  "overflow-x-clip overflow-y-visible " +
                  "max-w-full text-ellipsis text-nowrap "
                }
              >
                <span
                  className={
                    "ml-2 align-bottom " +
                    (largeTitle ? "text-sm/3.5 " : "text-xs/2.5")
                  }
                >
                  by
                </span>
                <span
                  className={
                    "ml-1.5 font-title align-bottom " +
                    (largeTitle ? "text-lg/4 " : "text-sm/3.5 ")
                  }
                >
                  {props.chartBrief?.chartCreator}
                </span>
              </span>
            </p>
          </div>
          <p className="leading-0 mt-1 ">
            <span className="inline-flex flex-row justify-end w-3 overflow-visible ">
              <span className="text-right text-base/4 ">
                {Math.floor(currentSec / 60)}
              </span>
            </span>
            <span>:</span>
            <span className="inline-block w-6 text-base/4 ">
              {(Math.floor(currentSec) % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-sm/4 ">
              <span>/</span>
              <span className="ml-1 ">{Math.floor(levelLength / 60)}</span>
              <span>:</span>
              <span className="">
                {(Math.floor(levelLength) % 60).toString().padStart(2, "0")}
              </span>
            </span>
          </p>
        </div>
      </div>
      <ProgressBar
        value={currentSec / levelLength}
        fixedColor="bg-red-600"
        className={props.isMobile ? "mx-2 " : "mr-1 "}
      />
      <button
        className={
          "absolute rounded-full p-2 cursor-pointer " +
          (props.isMobile
            ? "-bottom-9 inset-x-0 mx-auto w-max text-xl "
            : "bottom-0 right-1 ") +
          "hover:bg-slate-200/50 active:bg-slate-300/50 " +
          "hover:dark:bg-stone-700/50 active:dark:bg-stone-600/50 " +
          linkStyle1
        }
        onClick={() => setVolumeCtrlOpen(!volumeCtrlOpen)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <VolumeNotice theme="filled" />
      </button>
      <div
        className={
          "absolute z-10 " +
          (props.isMobile
            ? "bottom-0 inset-x-0 mx-auto w-80 max-w-full p-4 "
            : "top-full inset-x-0 mt-2 mr-1 p-3 ") +
          "rounded-lg border border-slate-400 dark:border-stone-600 " +
          "bg-white/75 dark:bg-stone-800/75 " +
          "transition-all duration-200 " +
          (volumeCtrlOpen
            ? "ease-out scale-100 opacity-100 "
            : "ease-in scale-0 opacity-0 ")
        }
        style={{
          transformOrigin: props.isMobile
            ? "center calc(100% + 0.5rem)"
            : "calc(100% - 0.75rem) -0.5rem",
          backdropFilter: "blur(2px)",
        }}
        onPointerEnter={(e) => {
          setPointerInVolumeCtrl(true);
          e.stopPropagation();
        }}
        onPointerLeave={(e) => {
          setPointerInVolumeCtrl(false);
          e.stopPropagation();
        }}
      >
        {!props.isMobile && (
          <span
            className={
              "absolute inline-block right-2 top-0 w-4 h-4 -translate-y-1/2 " +
              "border-l border-b rounded-tr-full " +
              "rotate-135 origin-center " +
              "border-slate-400 dark:border-stone-600 " +
              "bg-white dark:bg-stone-800 "
            }
          />
        )}
        <div className="flex flex-row items-center ">
          <Youtube className="text-xl " />
          <span className="text-sm w-7 text-right ">{props.ytVolume}</span>
          <Slider
            className="flex-1 mx-2 h-5! py-0! bg-transparent! "
            classNames={{
              rail: "inset-y-0! my-auto h-1.5! ",
              track: "inset-y-0! my-auto h-1.5! ",
              handle: "h-5! w-5! m-0! ",
            }}
            min={0}
            max={100}
            step={1}
            value={props.ytVolume}
            onChange={(v) => props.setYtVolume(v as number)}
          />
        </div>
        <div className="flex flex-row items-center mt-3 ">
          <SmilingFace
            className={
              "text-xl " +
              (props.enableSE ? "" : "text-slate-400 dark:text-stone-600 ")
            }
          />
          <span
            className={
              "text-sm w-7 text-right " +
              (props.enableSE ? "" : "text-slate-400 dark:text-stone-600 ")
            }
          >
            {props.seVolume}
          </span>
          <Slider
            className="flex-1 mx-2 h-5! py-0! bg-transparent! "
            classNames={{
              rail: "inset-y-0! my-auto h-1.5! ",
              track: "inset-y-0! my-auto h-1.5! ",
              handle: "h-5! w-5! m-0! ",
            }}
            min={0}
            max={100}
            step={1}
            disabled={!props.enableSE}
            value={props.seVolume}
            onChange={(v) => props.setSEVolume(v as number)}
          />
        </div>
      </div>
    </div>
  );
}
