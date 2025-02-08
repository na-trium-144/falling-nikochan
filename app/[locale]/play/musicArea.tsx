import { ChartBrief, levelTypes } from "@/../../chartFormat/chart.js";
import { levelBgColors } from "@/common/levelColors";
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
  const largeTitle = props.isMobile ? height && height > 8 * rem : true;

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
        <div className="flex-1 min-w-0 mr-1 flex flex-col justify-between ">
          <div className={props.isMobile ? "h-0 overflow-visible " : ""}>
            <p className={largeTitle ? "leading-5" : "leading-4"}>
              <span
                className={
                  "inline-block font-title " +
                  (largeTitle ? "text-2xl leading-6 " : "text-lg leading-4 ") +
                  "align-bottom " +
                  "overflow-hidden max-w-full text-ellipsis whitespace-nowrap "
                }
              >
                {props.chartBrief?.title}
              </span>
              <span
                className={
                  "inline-block font-title " +
                  (largeTitle ? "text-lg leading-4 " : "text-sm leading-3 ") +
                  "align-bottom " +
                  "overflow-hidden max-w-full text-ellipsis whitespace-nowrap "
                }
              >
                <span className="mx-1">/</span>
                {props.chartBrief?.composer}
              </span>
            </p>
            <p className={"mt-0.5 " + (largeTitle ? "leading-4" : "leading-3")}>
              {props.lvIndex !== undefined &&
                props.chartBrief?.levels[props.lvIndex] && (
                  <span
                    className={
                      "inline-block align-bottom " +
                      "overflow-hidden max-w-full text-ellipsis whitespace-nowrap "
                    }
                  >
                    {props.chartBrief?.levels[props.lvIndex].name && (
                      <span
                        className={
                          "font-title mr-1 " +
                          (largeTitle
                            ? "text-lg leading-6 "
                            : "text-base leading-5 ")
                        }
                      >
                        {props.chartBrief?.levels[props.lvIndex].name}
                      </span>
                    )}
                    <span
                      className={
                        largeTitle
                          ? "text-base leading-6 "
                          : "text-sm leading-5 "
                      }
                    >
                      {props.lvType}-
                    </span>
                    <span
                      className={
                        largeTitle ? "text-xl leading-6 " : "text-lg leading-5 "
                      }
                    >
                      {props.chartBrief?.levels[props.lvIndex]?.difficulty}
                    </span>
                  </span>
                )}
              <span
                className={
                  "inline-block align-bottom " +
                  "overflow-hidden max-w-full text-ellipsis whitespace-nowrap "
                }
              >
                <span
                  className={
                    "ml-2 " +
                    (largeTitle ? "text-sm leading-5 " : "text-xs leading-3 ")
                  }
                >
                  by
                </span>
                <span
                  className={
                    "ml-1.5 font-title " +
                    (largeTitle ? "text-lg leading-5 " : "text-sm leading-3 ")
                  }
                >
                  {props.chartBrief?.chartCreator}
                </span>
              </span>
            </p>
          </div>
          <p className="leading-4 mt-0.5 ">
            <div className="inline-flex flex-row justify-end w-3 overflow-visible ">
              <span className="text-right leading-4 ">
                {Math.floor(currentSec / 60)}
              </span>
            </div>
            <span>:</span>
            <span className="inline-block w-6 leading-4 ">
              {(Math.floor(currentSec) % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-sm leading-4 ">
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
