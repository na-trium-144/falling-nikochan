import { ChartBrief, levelBgColors, levelTypes } from "@/chartFormat/chart";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube";

interface Props {
  lvType: string;
  lvIndex?: number;
  isMobile: boolean;
  ytPlayer: { current?: YouTubePlayer };
  chartBrief?: ChartBrief;
  onReady: () => void;
  onStart: () => void;
  onStop: () => void;
}
export function MusicArea(props: Props) {
  return (
    <div
      className={
        "z-10 grow-0 shrink-0 p-3 rounded-lg flex " +
        (levelBgColors.at(levelTypes.indexOf(props.lvType)) ||
          levelBgColors[1]) +
        (props.isMobile ? "mt-3 mx-3 flex-row-reverse " : "my-3 mr-3 flex-col ")
      }
    >
      <FlexYouTube
        fixedSide="width"
        className={
          "z-10 " + (props.isMobile ? "grow-0 shrink-0 w-1/2" : "w-full")
        }
        scale={props.isMobile ? 0.5 : 1}
        isMobile={props.isMobile}
        id={props.chartBrief?.ytId}
        control={false}
        ytPlayer={props.ytPlayer}
        onReady={props.onReady}
        onStart={props.onStart}
        onStop={props.onStop}
      />
      <div className="flex-1 min-w-0 mr-1 ">
        <p
          className={
            "font-title text-lg leading-tight " +
            (props.isMobile
              ? "overflow-x-hidden w-full text-ellipsis whitespace-nowrap "
              : "mt-1.5 ")
          }
        >
          {props.chartBrief?.title}
        </p>
        <p
          className={
            "font-title text-sm leading-tight " +
            (props.isMobile
              ? "overflow-x-hidden w-full text-ellipsis whitespace-nowrap "
              : "")
          }
        >
          {props.chartBrief?.composer}
        </p>
        <p className="w-full" style={{ lineHeight: 0 }}>
          {props.lvIndex !== undefined &&
            props.chartBrief?.levels[props.lvIndex] && (
              <span
                className={
                  "inline-block " +
                  (props.isMobile
                    ? "overflow-x-hidden max-w-full text-ellipsis whitespace-nowrap "
                    : "")
                }
                style={{ marginTop: "-0.2rem" }}
              >
                {props.chartBrief?.levels[props.lvIndex].name && (
                  <span className="text-base font-title mr-1">
                    {props.chartBrief?.levels[props.lvIndex].name}
                  </span>
                )}
                <span className="text-sm">{props.lvType}-</span>
                <span className="text-lg">
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
            style={{ marginTop: "-0.2rem" }}
          >
            <span className="ml-2 text-xs">by</span>
            <span className="ml-1.5 font-title text-sm">
              {props.chartBrief?.chartCreator}
            </span>
          </span>
        </p>
      </div>
    </div>
  );
}
