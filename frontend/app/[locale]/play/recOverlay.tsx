import { Box } from "@/common/box";
import { ChartBrief } from "@falling-nikochan/chart";
import clsx from "clsx/lite";

interface Props {
  recording: boolean;
  isMobile: boolean;
  showGuidanceText: boolean;
  showThumbTitle: boolean;
  chartBrief?: ChartBrief;
  lvIndex: number;
  lvType: string;
}
export function RecOverlay(props: Props) {
  return (
    <>
      {!props.recording && (
        <div className="fixed top-0 left-0 w-8 h-8 bg-[#ff0000] z-100" />
      )}
      {!props.isMobile && (
        <Box
          classNameOuter={clsx(
            "fixed left-30 right-60 mx-auto top-[72vh] bottom-8 my-auto w-max h-max z-100",
            "px-6 py-3 text-center",
            "transition-opacity duration-1000 ease-linear",
            props.showGuidanceText ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="text-xl/6.5">
            Falling Nikochan はブラウザーから手軽に遊べる音ゲーです！
          </p>
          <p className="text-xl/6.5">
            概要欄のリンクからぜひ遊んでみてください！
          </p>
          <p className="text-base/5.5">
            Falling Nikochan is a rhythm game that can be played on web
            browsers.
          </p>
          <p className="text-base/5.5">
            Give it a try from the link in the description!
          </p>
        </Box>
      )}
      {props.showThumbTitle && (
        <>
          <div
            className={clsx(
              "fixed top-[72vh] bottom-8 my-auto w-max h-max z-100",
              "left-36 text-[4.5rem] tracking-[-0.00em]"
            )}
            style={{
              textShadow: "0.075em 0.1em 0.1em rgb(128, 128, 128, 0.7)",
            }}
          >
            <span className="font-bold font-title">title</span>
            <span className="text-[0.875em] ml-6 font-bold font-title">
              / composr
            </span>
          </div>
          <div
            className={clsx(
              "fixed left-4/7 right-0 w-max mx-auto bottom-[28vh] mb-4",
              "bolder-by-stroke text-7xl z-100",
              "fn-level-type",
              props.lvType
            )}
            style={{
              textShadow: "0.075em 0.1em 0.1em rgb(128, 128, 128, 0.7)",
            }}
          >
            <span>{props.lvType}-</span>
            <span>
              {props.chartBrief?.levels.at(props.lvIndex)?.difficulty}
            </span>
          </div>
        </>
      )}
    </>
  );
}
