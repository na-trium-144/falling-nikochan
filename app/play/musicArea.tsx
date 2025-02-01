import { ChartBrief, levelBgColors, levelTypes } from "@/chartFormat/chart.js";
import ProgressBar from "@/common/progressBar.js";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import { useDisplayMode } from "@/scale.js";
import { useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";

interface Props {
  lvType: string;
  lvIndex?: number;
  isMobile: boolean; // 横並び or 縦並び
  ytPlayer: { current?: YouTubePlayer };
  chartBrief?: ChartBrief;
  offset: number;
  onReady: () => void;
  onStart: () => void;
  onStop: () => void;
}
export function MusicArea(props: Props) {
  const { width, height, ref } = useResizeDetector();
  const { rem } = useDisplayMode();
  const ytHalf = width && width / 2 < 200;
  const largeTitle = props.isMobile && height && height > 8 * rem;
  console.log(largeTitle, height, rem)

  const [currentSec, setCurrentSec] = useState<number>(0);
  const levelLength =
    props.chartBrief && props.lvIndex !== undefined
      ? Math.max(
          0.1,
          props.chartBrief.levels[props.lvIndex].length + props.offset
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
        "z-10 grow-0 shrink-0 pt-3 px-3 pb-1 rounded-lg flex " +
        (levelBgColors.at(levelTypes.indexOf(props.lvType)) ||
          levelBgColors[1]) +
        (props.isMobile ? "mt-3 mx-3 " : "my-3 mr-3 ") +
        "flex-col "
      }
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
              "z-10 mb-1 " +
              (props.isMobile ? "grow-0 shrink-0 w-1/2 " : "w-full")
            }
            scale={ytHalf ? 0.5 : 1}
            id={props.chartBrief?.ytId}
            control={false}
            ytPlayer={props.ytPlayer}
            onReady={props.onReady}
            onStart={props.onStart}
            onStop={props.onStop}
          />
        )}
        <div className="flex-1 min-w-0 mr-1 flex flex-col ">
          <p
            className={
              "font-title leading-tight " +
              (largeTitle ? "text-2xl " : "text-lg ") +
              (props.isMobile
                ? "overflow-hidden w-full text-ellipsis whitespace-nowrap "
                : "")
            }
          >
            {props.chartBrief?.title}
          </p>
          <p
            className={
              "font-title leading-tight " +
              (largeTitle ? "text-lg " : "text-sm ") +
              (props.isMobile
                ? "overflow-hidden w-full text-ellipsis whitespace-nowrap "
                : "")
            }
          >
            {props.chartBrief?.composer}
          </p>
          <p
            className="w-full flex-1 "
            style={{
              fontSize: largeTitle ? "1.25rem" : "1rem",
              lineHeight: 1.1,
            }}
          >
            {props.lvIndex !== undefined &&
              props.chartBrief?.levels[props.lvIndex] && (
                <span
                  className={
                    "inline-block " +
                    (props.isMobile
                      ? "overflow-hidden max-w-full text-ellipsis whitespace-nowrap "
                      : "")
                  }
                >
                  {props.chartBrief?.levels[props.lvIndex].name && (
                    <span className="font-title mr-1">
                      {props.chartBrief?.levels[props.lvIndex].name}
                    </span>
                  )}
                  <span style={{ fontSize: "0.875em" }}>{props.lvType}-</span>
                  <span style={{ fontSize: "1.125em" }}>
                    {props.chartBrief?.levels[props.lvIndex]?.difficulty}
                  </span>
                </span>
              )}
            <span
              className={
                "inline-block " +
                (props.isMobile
                  ? "overflow-hidden max-w-full text-ellipsis whitespace-nowrap "
                  : "")
              }
            >
              <span className="ml-2 " style={{ fontSize: "0.75em" }}>
                by
              </span>
              <span
                className="ml-1.5 font-title "
                style={{ fontSize: "0.875em" }}
              >
                {props.chartBrief?.chartCreator}
              </span>
            </span>
          </p>
          <p className="" style={{ marginBottom: "-0.2rem" }}>
            <span className="inline-block w-3 text-right">
              {Math.floor(currentSec / 60)}
            </span>
            <span>:</span>
            <span className="inline-block w-6 ">
              {(Math.floor(currentSec) % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-sm ">
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
      <ProgressBar value={currentSec / levelLength} fixedColor="bg-red-600" />
    </div>
  );
}
