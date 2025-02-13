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
      <ProgressBar value={currentSec / levelLength} fixedColor="bg-red-600" />
    </div>
  );
}
