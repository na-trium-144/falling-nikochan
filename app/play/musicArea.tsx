import { ChartBrief, levelBgColors, levelTypes } from "@/chartFormat/chart";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube";
import { useDisplayMode } from "@/scale";
import { useResizeDetector } from "react-resize-detector";

interface Props {
  lvType: string;
  lvIndex?: number;
  isMobile: boolean; // 横並び or 縦並び
  ytPlayer: { current?: YouTubePlayer };
  chartBrief?: ChartBrief;
  onReady: () => void;
  onStart: () => void;
  onStop: () => void;
}
export function MusicArea(props: Props) {
  const { width, height, ref } = useResizeDetector();
  const { rem } = useDisplayMode();
  const ytHalf = width && width / 2 < 200;
  const largeTitle = props.isMobile && height && height > 8 * rem;

  return (
    <div
      className={
        "z-10 grow-0 shrink-0 p-3 rounded-lg flex " +
        (levelBgColors.at(levelTypes.indexOf(props.lvType)) ||
          levelBgColors[1]) +
        (props.isMobile ? "mt-3 mx-3 flex-row-reverse " : "my-3 mr-3 flex-col ")
      }
      ref={ref}
    >
      {width && (
        <FlexYouTube
          fixedSide="width"
          className={
            "z-10 " + (props.isMobile ? "grow-0 shrink-0 w-1/2 " : "w-full")
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
      <div className="flex-1 min-w-0 mr-1 ">
        <p
          className={
            "font-title leading-tight " +
            (largeTitle ? "text-2xl " : "text-lg ") +
            (props.isMobile
              ? "overflow-x-hidden w-full text-ellipsis whitespace-nowrap "
              : "mt-1.5 ")
          }
        >
          {props.chartBrief?.title}
        </p>
        <p
          className={
            "font-title leading-tight " +
            (largeTitle ? "text-lg " : "text-sm ") +
            (props.isMobile
              ? "overflow-x-hidden w-full text-ellipsis whitespace-nowrap "
              : "")
          }
        >
          {props.chartBrief?.composer}
        </p>
        <p
          className="w-full"
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
                    ? "overflow-x-hidden max-w-full text-ellipsis whitespace-nowrap "
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
                ? "overflow-x-hidden max-w-full text-ellipsis whitespace-nowrap "
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
      </div>
    </div>
  );
}
