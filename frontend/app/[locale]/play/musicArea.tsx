import clsx from "clsx/lite";
import { ChartBrief, levelTypes } from "@falling-nikochan/chart";
import { levelColors } from "@/common/levelColors";
import ProgressBar from "@/common/progressBar.js";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import { useDisplayMode } from "@/scale.js";
import { useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import SmilingFace from "@icon-park/react/lib/icons/SmilingFace";
import VolumeNotice from "@icon-park/react/lib/icons/VolumeNotice";
import Youtube from "@icon-park/react/lib/icons/Youtube";
import { linkStyle1 } from "@/common/linkStyle";
import { useTranslations } from "next-intl";
import { detectOS } from "@/common/pwaInstall";
import Range from "@/common/range";
import { useColorThief } from "@/common/colorThief";
import { defaultThemeStyle } from "@/common/theme";
import { boxBorderStyle1, boxBorderStyle2, boxStyle } from "@/common/box";

interface Props {
  ready: boolean;
  playing: boolean;
  className?: string;
  lvType: string;
  lvIndex?: number;
  isMobile: boolean; // 横並び or 縦並び
  isTouch: boolean;
  ytBeginSec: number;
  ytPlayer: { current?: YouTubePlayer };
  chartBrief?: ChartBrief;
  offset: number;
  onReady: () => void;
  onStart: () => void;
  onStop: () => void;
  onPlaybackRateChange: (rate: number) => void;
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
  const largeTitle = props.isMobile ? height && height > 7.5 * rem : true;
  const veryLargeTitle = props.isMobile ? height && height > 11.5 * rem : false;

  const t = useTranslations("play.message");

  const [volumeCtrlOpen, setVolumeCtrlOpen] = useState(false);
  const [ytVolumeCtrlAvailable, setYtVolumeCtrlAvailable] = useState(true);
  useEffect(() => {
    if (detectOS() === "ios") {
      // https://stackoverflow.com/questions/31147753/youtube-iframe-embed-cant-control-audio-on-ipad
      setYtVolumeCtrlAvailable(false);
    }
  }, []);
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
      ? Math.max(0.1, props.chartBrief.levels[props.lvIndex].length)
      : 0.1;
  useEffect(() => {
    const id = setInterval(() => {
      if (props.ytPlayer.current?.getCurrentTime) {
        setCurrentSec(
          Math.min(
            levelLength,
            Math.max(
              0,
              (props.ytPlayer.current.getCurrentTime() || 0) - props.ytBeginSec
            )
          )
        );
      }
    }, 50);
    return () => clearInterval(id);
  }, [props.ytPlayer, props.ytBeginSec, levelLength]);

  const colorThief = useColorThief();

  return (
    <div
      className={clsx(
        "z-10 grow-0 shrink-0 pb-1 flex",
        // levelBgColors.at(levelTypes.indexOf(props.lvType)) || levelBgColors[1],
        props.isMobile ? "rounded-b-xl" : "rounded-bl-box pl-3",
        "relative flex-col",
        props.className,
        colorThief.boxStyle
      )}
      style={{ color: colorThief.currentColor }}
      onPointerEnter={() => setPointerInVolumeCtrl(true)}
      onPointerLeave={() => setPointerInVolumeCtrl(false)}
      ref={ref}
    >
      <span
        className={clsx(
          colorThief.boxBorderStyle1,
          "border-t-0 border-r-0",
          props.isMobile && "border-l-0"
        )}
      />
      <span
        className={clsx(
          colorThief.boxBorderStyle2,
          "border-t-0 border-r-0",
          props.isMobile && "border-l-0"
        )}
      />
      <div
        className={clsx(
          "flex",
          props.isMobile ? "flex-row-reverse" : "flex-col"
        )}
      >
        {width && (
          <FlexYouTube
            fixedSide="width"
            className={clsx(
              "z-10",
              props.isMobile ? "grow-0 shrink-0 w-1/2 mb-1.5" : "w-full mb-1"
            )}
            scale={ytHalf ? 0.5 : 1}
            id={props.chartBrief?.ytId}
            control={false}
            ytPlayer={props.ytPlayer}
            onReady={props.onReady}
            onStart={props.onStart}
            onStop={props.onStop}
            onError={props.onError}
            onPlaybackRateChange={props.onPlaybackRateChange}
          />
        )}
        {props.chartBrief?.ytId && (
          <img
            ref={colorThief.imgRef}
            className="hidden"
            src={`https://i.ytimg.com/vi/${props.chartBrief?.ytId}/mqdefault.jpg`}
            crossOrigin="anonymous"
          />
        )}
        <div
          className={clsx(
            "flex-1 min-w-0 mr-1 flex flex-col justify-between ",
            defaultThemeStyle,
            props.isMobile && (largeTitle ? "ml-3 mt-4" : "ml-3 mt-2")
          )}
        >
          <div className={clsx(props.isMobile && "h-0 overflow-visible")}>
            <p
              className={clsx(
                veryLargeTitle ? "" : largeTitle ? "leading-5" : "leading-3.5"
              )}
            >
              {/* x-hiddenとy-visibleを組み合わせることはできないが、clipならok? */}
              <span
                className={clsx(
                  "inline-block font-title align-bottom",
                  veryLargeTitle
                    ? "block! text-3xl"
                    : largeTitle
                      ? "text-2xl/6"
                      : "text-lg/5",
                  "overflow-x-clip overflow-y-visible",
                  "max-w-full text-ellipsis text-nowrap"
                )}
              >
                {props.chartBrief?.title}
              </span>
              {props.chartBrief?.composer && (
                <span
                  className={clsx(
                    "inline-block font-title align-bottom",
                    veryLargeTitle
                      ? "block! text-2xl"
                      : largeTitle
                        ? "text-lg/5"
                        : "text-sm/3.5",
                    "overflow-x-clip overflow-y-visible",
                    "max-w-full text-ellipsis text-nowrap"
                  )}
                >
                  <span className="mx-1">/</span>
                  {props.chartBrief?.composer}
                </span>
              )}
            </p>
            <p
              className={clsx(
                veryLargeTitle
                  ? "leading-6"
                  : largeTitle
                    ? "leading-4.5"
                    : "leading-4"
              )}
            >
              {props.lvIndex !== undefined &&
                props.chartBrief?.levels[props.lvIndex] && (
                  <span
                    className={clsx(
                      "inline-block align-bottom",
                      "overflow-x-clip overflow-y-visible",
                      "max-w-full text-ellipsis text-nowrap",
                      veryLargeTitle
                        ? "leading-6"
                        : largeTitle
                          ? "leading-4.5"
                          : "leading-4"
                    )}
                  >
                    {props.chartBrief?.levels[props.lvIndex].name && (
                      <span
                        className={clsx(
                          "font-title mr-1 align-bottom",
                          veryLargeTitle
                            ? "text-2xl"
                            : largeTitle
                              ? "text-lg/4"
                              : "text-sm/3.5"
                        )}
                      >
                        {props.chartBrief?.levels[props.lvIndex].name}
                      </span>
                    )}
                    <span
                      className={clsx(
                        levelColors.at(levelTypes.indexOf(props.lvType)) ||
                          levelColors[1],
                        "align-bottom",
                        veryLargeTitle
                          ? "text-xl"
                          : largeTitle
                            ? "text-base/3"
                            : "text-xs/2.5"
                      )}
                    >
                      {props.lvType}-
                    </span>
                    <span
                      className={clsx(
                        levelColors.at(levelTypes.indexOf(props.lvType)) ||
                          levelColors[1],
                        "align-bottom",
                        veryLargeTitle
                          ? "text-3xl"
                          : largeTitle
                            ? "text-xl/4"
                            : "text-lg/3.5"
                      )}
                    >
                      {props.chartBrief?.levels[props.lvIndex]?.difficulty}
                    </span>
                  </span>
                )}
              <span
                className={clsx(
                  "inline-block align-bottom",
                  "overflow-x-clip overflow-y-visible",
                  "max-w-full text-ellipsis text-nowrap",
                  veryLargeTitle
                    ? "leading-6"
                    : largeTitle
                      ? "leading-4.5"
                      : "leading-4"
                )}
              >
                <span
                  className={clsx(
                    "ml-2 align-bottom",
                    veryLargeTitle
                      ? "text-lg"
                      : largeTitle
                        ? "text-sm/3.5"
                        : "text-xs/2.5"
                  )}
                >
                  by
                </span>
                <span
                  className={clsx(
                    "ml-1.5 font-title align-bottom",
                    veryLargeTitle
                      ? "text-2xl"
                      : largeTitle
                        ? "text-lg/4"
                        : "text-sm/3.5"
                  )}
                >
                  {props.chartBrief?.chartCreator}
                </span>
              </span>
            </p>
          </div>
          <p className="leading-0 mt-1 text-black/40 dark:text-white/40">
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
        fixedColor="bg-red-500/75"
        className={clsx(props.isMobile ? "mx-2" : "mr-1")}
      />
      <button
        className={clsx(
          "absolute rounded-full cursor-pointer leading-1",
          defaultThemeStyle,
          props.isMobile
            ? clsx(
                "-bottom-9 inset-x-0 mx-auto w-max text-xl",
                props.isTouch ? "bg-white/50 dark:bg-stone-800/50 p-2" : "p-2"
              )
            : "bottom-0 right-1 p-2",
          "hover:bg-slate-200/50 active:bg-slate-300/50",
          "hover:dark:bg-stone-700/50 active:dark:bg-stone-600/50",
          linkStyle1,
          props.isMobile &&
            (initialVolumeCtrlOpenDone.current
              ? "transition-all ease-out duration-300 opacity-100 "
              : "opacity-0")
        )}
        onClick={() => setVolumeCtrlOpen(!volumeCtrlOpen)}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <VolumeNotice theme="filled" className="inline-block align-middle" />
      </button>
      <div
        className={clsx(
          defaultThemeStyle,
          "absolute z-10",
          props.isMobile
            ? "bottom-0 inset-x-0 mx-auto w-80 max-w-full p-4"
            : "top-full left-3 right-1 mt-1 p-3",
          "rounded-box",
          boxStyle,
          "transition-all duration-200",
          volumeCtrlOpen
            ? "ease-out scale-100 opacity-100"
            : "ease-in scale-0 opacity-0"
        )}
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
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <span className={boxBorderStyle1} />
        <span className={boxBorderStyle2} />
        {/*{!props.isMobile && (
          <span
            className={clsx(
              "absolute inline-block right-2 top-0 w-4 h-4 -translate-y-1/2",
              "border-l border-b rounded-tr-full",
              "rotate-135 origin-center",
              "border-slate-400 dark:border-stone-600",
              "bg-white dark:bg-stone-800"
            )}
          />
        )}*/}
        <div className="flex flex-row items-center ">
          <Youtube className="text-xl " />
          <span className="text-sm w-8 text-center ">{props.ytVolume}</span>
          <Range
            className="flex-1 mx-1 "
            min={0}
            max={100}
            disabled={!ytVolumeCtrlAvailable}
            value={ytVolumeCtrlAvailable ? props.ytVolume : 100}
            onChange={props.setYtVolume}
          />
        </div>
        <div className="flex flex-row items-center mt-3 ">
          <SmilingFace
            className={clsx(
              "text-xl",
              props.enableSE || "text-slate-400 dark:text-stone-600"
            )}
          />
          <span
            className={clsx(
              "text-sm w-8 text-center",
              props.enableSE || "text-slate-400 dark:text-stone-600"
            )}
          >
            {props.enableSE ? props.seVolume : t("off")}
          </span>
          <Range
            className="flex-1 mx-1 "
            min={0}
            max={100}
            disabled={!props.enableSE}
            value={props.enableSE ? props.seVolume : 0}
            onChange={props.setSEVolume}
          />
        </div>
      </div>
    </div>
  );
}
