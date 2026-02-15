import clsx from "clsx/lite";
import { ChartBrief } from "@falling-nikochan/chart";
import ProgressBar from "@/common/progressBar.js";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import { useDisplayMode } from "@/scale.js";
import { useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import SmilingFace from "@icon-park/react/lib/icons/SmilingFace";
import VolumeNotice from "@icon-park/react/lib/icons/VolumeNotice";
import Youtube from "@icon-park/react/lib/icons/Youtube";
import { useTranslations } from "next-intl";
import { detectOS } from "@/common/pwaInstall";
import Range from "@/common/range";
import { useColorThief } from "@/common/colorThief";
import { ButtonHighlight } from "@/common/button";

interface Props {
  ready: boolean;
  playing: boolean;
  playbackRate: number;
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
  const {
    ready,
    playing,
    playbackRate,
    className,
    lvType,
    lvIndex,
    isMobile,
    isTouch,
    ytBeginSec,
    ytPlayer,
    chartBrief,
    onReady,
    onStart,
    onStop,
    onPlaybackRateChange,
    onError,
    ytVolume,
    setYtVolume,
    enableSE,
    seVolume,
    setSEVolume,
  } = props;
  const { width, height, ref } = useResizeDetector();
  const { rem } = useDisplayMode();
  const ytHalf = width && width / 2 < 200;
  const largeTitle = isMobile ? height && height > 8.5 * rem : true;
  const veryLargeTitle = isMobile
    ? height && height > 11.5 * rem
    : width && width > 30 * rem;

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
    if (ready && !initialVolumeCtrlOpenDone.current) {
      const t = setTimeout(() => {
        setVolumeCtrlOpen(true);
        initialVolumeCtrlOpenDone.current = true;
      }, 500);
      return () => clearTimeout(t);
    }
  }, [ready]);
  useEffect(() => {
    if (playing && volumeCtrlOpen && !pointerInVolumeCtrl) {
      const t = setTimeout(() => {
        setVolumeCtrlOpen(false);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [playing, volumeCtrlOpen, pointerInVolumeCtrl]);

  const [currentSec, setCurrentSec] = useState<number>(0);
  const levelLength =
    chartBrief &&
    lvIndex !== undefined &&
    chartBrief.levels[lvIndex]
      ? Math.max(0.1, chartBrief.levels[lvIndex].length)
      : 0.1;
  useEffect(() => {
    const id = setInterval(() => {
      if (ytPlayer.current?.getCurrentTime) {
        setCurrentSec(
          Math.min(
            levelLength,
            Math.max(
              0,
              (ytPlayer.current.getCurrentTime() || 0) - ytBeginSec
            )
          )
        );
      }
    }, 50);
    return () => clearInterval(id);
  }, [ytPlayer, ytBeginSec, levelLength]);

  const colorThief = useColorThief();

  return (
    <div
      className={clsx(
        "grow-0 shrink-0 flex",
        // levelBgColors.at(levelTypes.indexOf(lvType)) || levelBgColors[1],
        isMobile
          ? "rounded-b-sq-xl pb-1"
          : "rounded-bl-sq-box pl-3 pb-1.5",
        "relative flex-col",
        className,
        colorThief.boxStyle
      )}
      style={{ color: colorThief.currentColor }}
      onPointerEnter={() => setPointerInVolumeCtrl(true)}
      onPointerLeave={() => setPointerInVolumeCtrl(false)}
      ref={ref}
    >
      <span
        className={clsx(
          "fn-glass-1",
          "border-t-0 border-r-0",
          props.isMobile && "border-l-0"
        )}
      />
      <span
        className={clsx(
          "fn-glass-2",
          "border-t-0 border-r-0",
          props.isMobile && "border-l-0"
        )}
      />
      <div
        className={clsx(
          "flex",
          isMobile ? "flex-row-reverse" : "flex-col"
        )}
      >
        {width && (
          <FlexYouTube
            fixedSide="width"
            className={clsx(
              "z-10",
              isMobile ? "grow-0 shrink-0 w-1/2 mb-1.5" : "w-full mb-1"
            )}
            scale={ytHalf ? 0.5 : 1}
            id={chartBrief?.ytId}
            control={false}
            ytPlayer={ytPlayer}
            onReady={onReady}
            onStart={onStart}
            onStop={onStop}
            onError={onError}
            onPlaybackRateChange={onPlaybackRateChange}
          />
        )}
        {chartBrief?.ytId && (
          <img
            ref={colorThief.imgRef}
            className="hidden"
            src={`https://i.ytimg.com/vi/${chartBrief?.ytId}/mqdefault.jpg`}
            crossOrigin="anonymous"
          />
        )}
        <div
          className={clsx(
            "flex-1 min-w-0 mr-1 flex flex-col justify-between ",
            "fg-base",
            isMobile && (largeTitle ? "ml-3 mt-4" : "ml-3 mt-2")
          )}
        >
          <div className={clsx(isMobile && "h-0 overflow-visible")}>
            <p
              className={clsx(
                "flex flex-wrap items-baseline",
                "font-medium font-title",
                "fg-bright",
                veryLargeTitle
                  ? "*:h-8 **:leading-8"
                  : largeTitle
                    ? "*:h-6.5 **:leading-6.5"
                    : "*:h-4.5 **:leading-4.5"
              )}
            >
              {/* x-hiddenとy-visibleを組み合わせることはできないが、clipならok? */}
              <span
                className={clsx(
                  veryLargeTitle
                    ? "text-3xl"
                    : largeTitle
                      ? "text-2xl"
                      : "text-lg",
                  "overflow-x-clip overflow-y-visible",
                  "max-w-full text-ellipsis whitespace-nowrap"
                )}
              >
                {chartBrief?.title}
              </span>
              {chartBrief?.composer && (
                <span
                  className={clsx(
                    veryLargeTitle
                      ? "text-2xl"
                      : largeTitle
                        ? "text-lg"
                        : "text-sm",
                    "overflow-x-clip overflow-y-visible",
                    "max-w-full text-ellipsis whitespace-nowrap"
                  )}
                >
                  <span className="mx-[0.25em]">/</span>
                  {chartBrief?.composer}
                </span>
              )}
            </p>
            <p
              className={clsx(
                "flex flex-wrap items-baseline",
                "fg-bright",
                veryLargeTitle
                  ? "*:h-7 **:leading-7"
                  : largeTitle
                    ? "*:h-5 **:leading-5"
                    : "*:h-4 **:leading-4"
              )}
            >
              {lvIndex !== undefined &&
                chartBrief?.levels[lvIndex] && (
                  <span
                    className={clsx(
                      "overflow-x-clip overflow-y-visible",
                      "max-w-full text-ellipsis whitespace-nowrap"
                    )}
                  >
                    {chartBrief?.levels[lvIndex].name && (
                      <span
                        className={clsx(
                          "font-title mr-[0.25em]",
                          veryLargeTitle
                            ? "text-2xl"
                            : largeTitle
                              ? "text-lg"
                              : "text-sm"
                        )}
                      >
                        {chartBrief?.levels[lvIndex].name}
                      </span>
                    )}
                    <span
                      className={clsx(
                        "fn-level-type",
                        lvType,
                        veryLargeTitle
                          ? "text-2xl"
                          : largeTitle
                            ? "text-lg"
                            : "text-sm"
                      )}
                    >
                      <span>{lvType}-</span>
                      <span>
                        {chartBrief?.levels[lvIndex]?.difficulty}
                      </span>
                    </span>
                  </span>
                )}
              <span
                className={clsx(
                  "overflow-x-clip overflow-y-visible",
                  "max-w-full text-ellipsis whitespace-nowrap"
                )}
              >
                <span
                  className={clsx(
                    "ml-[0.5em]",
                    veryLargeTitle
                      ? "text-lg"
                      : largeTitle
                        ? "text-sm"
                        : "text-xs"
                  )}
                >
                  by
                </span>
                <span
                  className={clsx(
                    "ml-[0.2em] font-title",
                    veryLargeTitle
                      ? "text-2xl"
                      : largeTitle
                        ? "text-lg"
                        : "text-sm"
                  )}
                >
                  {chartBrief?.chartCreator}
                </span>
              </span>
            </p>
          </div>
          <p
            className={clsx(
              "leading-[1em] mt-1.5",
              isMobile
                ? veryLargeTitle
                  ? "flex flex-row justify-between mr-1.5"
                  : "flex flex-col-reverse"
                : "flex flex-row gap-[0.5em]",
              veryLargeTitle ? "text-xl" : largeTitle ? "text-base" : "text-sm",
              "text-dim",
              playbackRate > 1
                ? "text-rose-600 dark:text-rose-400"
                : playbackRate < 1
                  ? "text-emerald-600 dark:text-emerald-400"
                  : ""
            )}
          >
            <span className="flex-none w-max">
              <span className="inline-flex flex-row justify-end w-[0.75em] overflow-visible">
                <span className="text-right">
                  {Math.floor(currentSec / 60)}
                </span>
              </span>
              <span>:</span>
              <span className="inline-block w-[1.5em]">
                {(Math.floor(currentSec) % 60).toString().padStart(2, "0")}
              </span>
              <span style={{ fontSize: "0.875em", lineHeight: 0 }}>
                <span>/</span>
                <span className="ml-[0.25em] ">
                  {Math.floor(levelLength / 60)}
                </span>
                <span>:</span>
                <span className="">
                  {(Math.floor(levelLength) % 60).toString().padStart(2, "0")}
                </span>
              </span>
            </span>
            {playbackRate !== 1 && (
              <span className="flex-none w-max">
                <span style={{ fontSize: "0.875em", lineHeight: 0 }}>
                  {t("playbackRateDisplay")}:
                </span>
                <span className="ml-[0.25em]">{playbackRate}</span>
              </span>
            )}
          </p>
        </div>
      </div>
      <ProgressBar
        value={currentSec / levelLength}
        fixedColor="bg-red-500/75"
        className={clsx(isMobile ? "mx-2" : "ml-0.5 mr-1")}
      />
      <button
        className={clsx(
          "fn-icon-button absolute",
          "fg-base",
          isMobile
            ? clsx(
                "-bottom-9 inset-x-0 mx-auto w-max text-xl",
                isTouch ? "fn-with-bg" : ""
              )
            : "bottom-0 right-1",
          isMobile &&
            (initialVolumeCtrlOpenDone.current
              ? "transition-all ease-out duration-300 opacity-100 "
              : "opacity-0")
        )}
        onClick={() => setVolumeCtrlOpen(!volumeCtrlOpen)}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <ButtonHighlight />
        <VolumeNotice theme="filled" className="inline-block align-middle" />
      </button>
      <div
        className={clsx(
          "fg-base",
          "absolute z-10",
          isMobile
            ? "bottom-0 inset-x-0 mx-auto w-80 max-w-full p-4"
            : "top-full left-3 ml-auto max-w-100 right-1 mt-1 p-3",
          "rounded-sq-box",
          "fn-plain",
          "transition-all duration-200",
          volumeCtrlOpen
            ? "ease-out scale-100 opacity-100"
            : "ease-in scale-0 opacity-0"
        )}
        style={{
          transformOrigin: isMobile
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
        <span className="fn-glass-1" />
        <span className="fn-glass-2" />
        {/*{!props.isMobile && (
          <span
            className={clsx(
              "absolute inline-block right-2 top-0 w-4 h-4 -translate-y-1/2",
              "border-l border-b rounded-tr-full",
              "rotate-135 origin-center",
              "border-slate-400 dark:border-stone-600",
              "bg-white dark:bg-stone-700"
            )}
          />
        )}*/}
        <div className="flex flex-row items-center ">
          <Youtube className="text-xl " />
          <span className="text-sm w-8 text-center ">{ytVolume}</span>
          <Range
            className="flex-1 mx-1 "
            min={0}
            max={100}
            disabled={!ytVolumeCtrlAvailable}
            value={ytVolumeCtrlAvailable ? ytVolume : 100}
            onChange={setYtVolume}
          />
        </div>
        <div className="flex flex-row items-center mt-3 ">
          <SmilingFace
            className={clsx("text-xl", enableSE || "text-dim")}
          />
          <span
            className={clsx(
              "text-sm w-8 text-center",
              enableSE || "text-dim"
            )}
          >
            {enableSE ? seVolume : t("off")}
          </span>
          <Range
            className="flex-1 mx-1 "
            min={0}
            max={100}
            disabled={!enableSE}
            value={enableSE ? seVolume : 0}
            onChange={setSEVolume}
          />
        </div>
      </div>
    </div>
  );
}
