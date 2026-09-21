"use client";

import clsx from "clsx/lite";
import {
  ChartBrief,
  ChartSeqData,
  currentChartVer,
  getSignatureState,
  getStep,
  getTimeSec,
  Step,
  stepAdd,
  stepCmp,
  stepZero,
  updateBarNum,
} from "@falling-nikochan/chart";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import * as msgpack from "@msgpack/msgpack";
import { getSession } from "@/play/session.js";
import { captureAndWrap, fetchBackend } from "@/common/fetch.js";
import { markAsExpected } from "@/common/apiError.js";
import { refreshBrief } from "@/common/briefCache.js";
import { getQueryOptions } from "@/play/queryOption.js";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import { useResizeDetector } from "react-resize-detector";
import { useDisplayMode } from "@/scale.js";
import { useColorThief } from "@/common/colorThief.js";
import Button from "@/common/button.js";
import Select from "@/common/select.js";
import CheckBox from "@/common/checkBox.js";
import Range from "@/common/range.js";
import { Box, CenterBox } from "@/common/box.js";
import { SlimeSVG } from "@/common/slime.js";
import { useSE } from "@/common/se.js";
import VolumeNotice from "@icon-park/react/lib/icons/VolumeNotice";
import SmilingFace from "@icon-park/react/lib/icons/SmilingFace";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import { IrasutoyaLikeGrass } from "@/common/irasutoyaLike.jsx";
import InspectFallingWindow from "./fallingWindow.js";
import TimeBar from "@/edit/timeBar.js";
import {
  historyBackWithReview,
  useInsideFrameDetector,
  useStandaloneDetector,
} from "@/common/pwaInstall.jsx";
import { titleWithSiteName } from "@/common/title.js";
import { InitErrorMessage } from "@/play/messageBox.js";

interface ChartEvent {
  step: Step;
  timeSec: number;
  type: "note" | "bpm" | "speed" | "signature";
}

function getAllEvents(chartSeq: ChartSeqData): ChartEvent[] {
  const events: ChartEvent[] = [];
  for (const n of chartSeq.notes) {
    events.push({
      step: n.step,
      timeSec: n.hitTimeSec,
      type: "note",
    });
  }
  for (const b of chartSeq.bpmChanges) {
    events.push({
      step: b.step,
      timeSec: b.timeSec,
      type: "bpm",
    });
  }
  for (const s of chartSeq.speedChanges) {
    events.push({
      step: s.step,
      timeSec: s.timeSec,
      type: "speed",
    });
  }
  for (const sig of chartSeq.signature) {
    events.push({
      step: sig.step,
      timeSec: getTimeSec(chartSeq.bpmChanges, sig.step),
      type: "signature",
    });
  }
  events.sort((a, b) => {
    const cmp = stepCmp(a.step, b.step);
    if (cmp !== 0) return cmp;
    return a.timeSec - b.timeSec;
  });
  return events;
}

function getUniqueEventTimes(
  events: ChartEvent[]
): { step: Step; timeSec: number }[] {
  const result: { step: Step; timeSec: number }[] = [];
  for (const ev of events) {
    if (
      result.length === 0 ||
      stepCmp(result[result.length - 1].step, ev.step) !== 0
    ) {
      result.push({ step: ev.step, timeSec: ev.timeSec });
    }
  }
  return result;
}

export function InitInspect() {
  const te = useTranslations("error");

  const [cid, setCid] = useState<string>();
  const [chartBrief, setChartBrief] = useState<ChartBrief>();
  const [chartSeq, setChartSeq] = useState<ChartSeqData>();
  const [errorMsg, setErrorMsg] = useState<string | Error>();

  useEffect(() => {
    const q = getQueryOptions();
    const session = getSession(q.sid);
    if (session === null) {
      setErrorMsg(te("noSession"));
      return;
    }

    setCid(session.cid);
    setChartBrief(session.brief);

    if (session.editing) {
      setChartSeq(session.level);
      setErrorMsg(undefined);
    } else {
      fetchBackend()
        .url(`/api/seqFile/${session.cid}/${session.lvIndex}`)
        .headers({ "X-If-Match": `"${session.brief.etag}"` })
        .get()
        .badRequest(markAsExpected)
        .notFound(markAsExpected)
        .error(412, (e) => {
          refreshBrief(session.cid);
          markAsExpected(e);
        })
        .arrayBuffer((buf) => {
          const seq = msgpack.decode(buf) as ChartSeqData;
          if (seq.ver === 6 || seq.ver === 15 || seq.ver === currentChartVer) {
            return { seq, error: undefined };
          } else {
            return {
              seq: undefined,
              error: te("chartVersion", { ver: (seq as any)?.ver }),
            };
          }
        })
        .catch((e: unknown) => ({
          seq: undefined,
          error: captureAndWrap(e),
        }))
        .then(({ seq, error }) => {
          setChartSeq(seq);
          setErrorMsg(error);
        });
    }
  }, [te]);

  return (
    <Inspect
      errorMsg={errorMsg}
      cid={cid}
      chartBrief={chartBrief}
      chartSeq={chartSeq}
    />
  );
}

interface InspectProps {
  errorMsg?: string | Error;
  cid?: string;
  chartBrief?: ChartBrief;
  chartSeq?: ChartSeqData;
}

function Inspect(props: InspectProps) {
  const { errorMsg, cid, chartBrief, chartSeq } = props;
  const t = useTranslations("inspect");
  const {
    isTouch,
    isMobileGame: isMobile,
    rem,
    screenHeight,
  } = useDisplayMode();
  const standalone = useStandaloneDetector();
  const insideFrame = useInsideFrameDetector();

  const ref = useRef<HTMLDivElement | null>(null);
  const ytPlayer = useRef<YouTubePlayer | undefined>(undefined);

  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [playing, setPlaying] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(0);

  const colorThief = useColorThief();
  const youtubeSpace = useResizeDetector();
  const youtubeFitToWidth =
    isMobile || (youtubeSpace.width ?? 0) / (youtubeSpace.height ?? 0) < 16 / 9;

  useEffect(() => {
    document.title = titleWithSiteName(
      t("title", {
        title: chartBrief?.title || "",
        cid: cid || "",
      })
    );
  });

  const onReady = useCallback(() => {
    setReady(true);
  }, []);
  const onStart = useCallback(() => {
    setPlaying(true);
  }, []);
  const onStop = useCallback(() => {
    setPlaying(false);
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    ytPlayer.current?.setPlaybackRate?.(rate);
  }, []);

  const start = useCallback(() => {
    if (chartSeq) {
      ytPlayer.current?.seekTo?.(currentTimeSec + chartSeq.offset, true);
    }
    ytPlayer.current?.playVideo?.();
    ref.current?.focus();
  }, [chartSeq, currentTimeSec]);

  const stop = useCallback(() => {
    ytPlayer.current?.pauseVideo?.();
    ref.current?.focus();
  }, []);

  const setAndSeekCurrentTimeWithoutOffset = useCallback(
    (timeSec: number, focus = true, allowSeekAhead = true) => {
      const clampedTime = Math.max(0, timeSec - (chartSeq?.offset || 0));
      setCurrentTimeSec(clampedTime);
      if (
        !playing &&
        ytPlayer.current &&
        ytPlayer.current.getPlayerState?.() !== 5
      ) {
        ytPlayer.current.seekTo?.(timeSec, allowSeekAhead);
      }
      if (focus) {
        ref.current?.focus();
      }
    },
    [playing, chartSeq]
  );

  // 再生中に時刻を更新
  useEffect(() => {
    if (playing) {
      const i = setInterval(() => {
        if (ytPlayer.current?.getCurrentTime && chartSeq) {
          const ytTime = ytPlayer.current.getCurrentTime();
          setCurrentTimeSec(Math.max(0, ytTime - chartSeq.offset));
        }
      }, 50);
      return () => clearInterval(i);
    }
  }, [playing, chartSeq]);

  const getCurrentTimeSecForFW = useCallback(() => {
    if (playing && ytPlayer.current?.getCurrentTime && chartSeq) {
      return Math.max(0, ytPlayer.current.getCurrentTime() - chartSeq.offset);
    }
    return currentTimeSec;
  }, [playing, chartSeq, currentTimeSec]);

  // SE設定
  const {
    playSE,
    audioLatency,
    enableHitSE,
    setEnableHitSE,
    hitVolume,
    setHitVolume,
    enableBeatSE,
    setEnableBeatSE,
    beatVolume,
    setBeatVolume,
  } = useSE(cid, 0, true, {
    hitVolume: "seVolume",
    hitVolumeCid: cid ? `seVolume-${cid}` : undefined,
    enableHitSE: "enableSEInspect",
    beatVolume: "beatVolume",
    beatVolumeCid: cid ? `beatVolume-${cid}` : undefined,
    enableBeatSE: "enableBeatInspect",
  });

  const audioLatencyRef = useRef<number>(0);
  audioLatencyRef.current = audioLatency || 0;

  // ノートSEタイマー
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const initSETimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (playing && ytPlayer.current && chartSeq) {
        let index = 0;
        const now =
          (ytPlayer.current.getCurrentTime?.() ?? 0) -
          (chartSeq.offset || 0) +
          audioLatencyRef.current;
        while (
          index < chartSeq.notes.length &&
          chartSeq.notes[index].hitTimeSec < now
        ) {
          index++;
        }
        const playOne = () => {
          if (ytPlayer.current && chartSeq) {
            const now =
              (ytPlayer.current.getCurrentTime?.() ?? 0) -
              chartSeq.offset +
              audioLatencyRef.current;
            timer = null;
            while (
              index < chartSeq.notes.length &&
              chartSeq.notes[index].hitTimeSec <= now
            ) {
              playSE(chartSeq.notes[index].big ? "hitBig" : "hit");
              index++;
            }
            if (index < chartSeq.notes.length) {
              timer = setTimeout(
                playOne,
                (chartSeq.notes[index].hitTimeSec - now) * 1000
              );
            }
          }
        };
        if (index < chartSeq.notes.length) {
          timer = setTimeout(
            playOne,
            (chartSeq.notes[index].hitTimeSec - now) * 1000
          );
        }
      }
    };
    initSETimer();
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [playing, chartSeq, playSE]);

  const signatureWithBarNum = useMemo(
    () => (chartSeq ? updateBarNum(chartSeq.signature) : []),
    [chartSeq]
  );

  // メトロノームSEタイマー
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const initSETimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (playing && ytPlayer.current && chartSeq) {
        const now =
          (ytPlayer.current.getCurrentTime?.() ?? 0) -
          (chartSeq.offset || 0) +
          audioLatencyRef.current;
        let step = getStep(chartSeq.bpmChanges, now, 4);
        const playOne = () => {
          if (ytPlayer.current && chartSeq) {
            const now =
              (ytPlayer.current.getCurrentTime?.() ?? 0) -
              chartSeq.offset +
              audioLatencyRef.current;
            timer = null;
            while (getTimeSec(chartSeq.bpmChanges, step) <= now) {
              const ss = getSignatureState(signatureWithBarNum, step);
              if (ss.count.numerator === 0 && stepCmp(step, stepZero()) >= 0) {
                playSE(ss.count.fourth === 0 ? "beat1" : "beat");
              }
              step = stepAdd(step, { fourth: 0, numerator: 1, denominator: 4 });
            }
            timer = setTimeout(
              playOne,
              (getTimeSec(chartSeq.bpmChanges, step) - now) * 1000
            );
          }
        };
        playOne();
      }
    };
    initSETimer();
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [playing, playSE, chartSeq, signatureWithBarNum]);

  // カーソル移動 (前/次のイベント)
  const seekPrevEvent = useCallback(() => {
    if (!chartSeq) return;
    const events = getUniqueEventTimes(getAllEvents(chartSeq));
    const target = events
      .filter((ev) => ev.timeSec < currentTimeSec - 0.005)
      .pop();
    if (!target) {
      setAndSeekCurrentTimeWithoutOffset(0);
    } else {
      setAndSeekCurrentTimeWithoutOffset(target.timeSec + chartSeq.offset);
    }
  }, [chartSeq, currentTimeSec, setAndSeekCurrentTimeWithoutOffset]);

  const seekNextEvent = useCallback(() => {
    if (!chartSeq) return;
    const events = getUniqueEventTimes(getAllEvents(chartSeq));
    const target = events.find((ev) => ev.timeSec > currentTimeSec + 0.005);
    if (target) {
      setAndSeekCurrentTimeWithoutOffset(target.timeSec + chartSeq.offset);
    }
  }, [chartSeq, currentTimeSec, setAndSeekCurrentTimeWithoutOffset]);

  // キーボードショートカット
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (!chartSeq) return;
      if (e.key === " " && !playing) {
        start();
        e.preventDefault();
      } else if (
        (e.key === "Escape" || e.key === "Esc" || e.key === " ") &&
        playing
      ) {
        stop();
        e.preventDefault();
      } else if (e.key === "Left" || e.key === "ArrowLeft") {
        seekPrevEvent();
        e.preventDefault();
      } else if (e.key === "Right" || e.key === "ArrowRight") {
        seekNextEvent();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [chartSeq, playing, start, stop, seekPrevEvent, seekNextEvent]);

  const currentStep = chartSeq
    ? getStep(chartSeq.bpmChanges, currentTimeSec, 192)
    : stepZero();

  const currentSignatureState = chartSeq
    ? getSignatureState(signatureWithBarNum, currentStep)
    : null;

  const currentStepStr = currentSignatureState
    ? currentSignatureState.barNum +
      1 +
      ";" +
      (currentSignatureState.count.fourth + 1) +
      (currentSignatureState.count.numerator > 0
        ? "+" +
          currentSignatureState.count.numerator +
          "/" +
          currentSignatureState.count.denominator * 4
        : "")
    : "-";

  // 選択中の音符（現在カーソル位置と一致する音符）
  const selectedNotes =
    chartSeq?.notes.filter(
      (n) =>
        Math.abs(n.hitTimeSec - currentTimeSec) < 0.005 ||
        stepCmp(n.step, currentStep) === 0
    ) || [];

  const ytId = chartBrief?.ytId;

  if (errorMsg) {
    return (
      <InitErrorMessage
        className="isolate z-play-error"
        msg={errorMsg}
        isTouch={isTouch}
        exit={() => {
          if (standalone || insideFrame) {
            historyBackWithReview();
          } else {
            window.close();
          }
        }}
      />
    );
  }

  if (!chartSeq) {
    return (
      <CenterBox classNameOuter="isolate z-play-loading">
        <p>
          <SlimeSVG />
          Loading...
        </p>
      </CenterBox>
    );
  }

  return (
    <main
      className="w-full h-dvh overflow-hidden select-none flex flex-col"
      tabIndex={0}
      ref={ref}
    >
      <div
        className={clsx(
          "flex-1 min-h-0 w-full flex items-stretch",
          isMobile ? "flex-col overflow-y-auto" : "flex-row-reverse"
        )}
      >
        {/* 右ペイン (PC) / 上部 (Mobile) */}
        <div
          className={clsx(
            isMobile
              ? "w-full flex-none p-3"
              : "w-1/3 min-w-80 max-w-sm h-full p-3 overflow-y-auto",
            "flex flex-col items-stretch gap-2 shrink-0"
          )}
        >
          {/* ヘッダー */}
          <div className="flex flex-row items-center justify-between">
            {(standalone || insideFrame) && (
              <button
                className="fn-link-1 text-sm mr-2 flex items-center"
                onClick={() => historyBackWithReview()}
              >
                <ArrowLeft className="mr-1" />
                {t("back")}
              </button>
            )}
            <span className="font-title truncate text-sm flex-1">
              {chartBrief?.title}
            </span>
            <span className="text-xs text-dim ml-2 whitespace-nowrap">
              ID: {cid}
            </span>
          </div>

          {/* YouTube 埋め込み */}
          <div ref={youtubeSpace.ref} className="w-full aspect-video flex-none">
            <div
              className={clsx(
                "w-full h-full relative p-2 rounded-sq-xl",
                colorThief.boxStyle
              )}
              style={{ color: colorThief.currentColor }}
            >
              <span className="fn-glass-1" />
              <span className="fn-glass-2" />
              <FlexYouTube
                fixedSide={youtubeFitToWidth ? "width" : "height"}
                className={youtubeFitToWidth ? "w-full" : "h-full"}
                control={true}
                id={ytId}
                ytPlayer={ytPlayer}
                onReady={onReady}
                onStart={onStart}
                onStop={onStop}
                onPlaybackRateChange={setPlaybackRate}
              />
              {ytId && (
                <img
                  ref={colorThief.imgRef}
                  className="hidden"
                  src={`https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`}
                  crossOrigin="anonymous"
                  alt=""
                />
              )}
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex flex-wrap items-center gap-1">
            <Select
              options={["0.25", "0.5", "0.75", "1", "1.5", "2"].map((s) => ({
                label: <>×{s}</>,
                value: s,
              }))}
              value={playbackRate.toString()}
              onSelect={(s: string) => changePlaybackRate(Number(s))}
              showValue
            />
            <Button
              onClick={() => {
                if (ready) {
                  if (!playing) {
                    start();
                  } else {
                    stop();
                  }
                }
              }}
              text={
                playing ? t("playerControls.pause") : t("playerControls.play")
              }
              keyName="Space"
            />
            <Button
              onClick={seekPrevEvent}
              text={t("playerControls.prevEvent")}
              keyName="←"
            />
            <Button
              onClick={seekNextEvent}
              text={t("playerControls.nextEvent")}
              keyName="→"
            />
            <div className="flex items-center ml-auto gap-0.5">
              <span className="text-xs mr-0.5">{t("zoom")}</span>
              <Button
                small
                text="-"
                onClick={() => setZoom((z) => Math.max(-2, z - 1))}
              />
              <Button
                small
                text="+"
                onClick={() => setZoom((z) => Math.min(3, z + 1))}
              />
            </div>
          </div>

          {/* 音量調整 */}
          <div className="flex flex-col gap-1 text-xs">
            <div className="relative flex items-center">
              <CheckBox
                id="enableHitSE"
                value={enableHitSE}
                onChange={(v) => setEnableHitSE(v)}
              >
                <span className="inline-block w-4" />
                {t("se")}
              </CheckBox>
              <SmilingFace className="absolute left-5 inline-block inset-y-0 h-max m-auto" />
              <VolumeNotice
                theme="filled"
                className={clsx(
                  "inline-block align-middle ml-2 text-sm",
                  enableHitSE || "text-dim"
                )}
              />
              <span
                className={clsx(
                  "inline-block w-6 text-center",
                  enableHitSE || "text-dim"
                )}
              >
                {hitVolume}
              </span>
              <Range
                className="align-middle flex-1 ml-1"
                min={0}
                max={100}
                disabled={!enableHitSE}
                value={hitVolume}
                onChange={setHitVolume}
              />
            </div>
            <div className="relative flex items-center">
              <CheckBox
                id="enableBeatSE"
                value={enableBeatSE}
                onChange={(v) => setEnableBeatSE(v)}
              >
                {t("beatSE")}
              </CheckBox>
              <VolumeNotice
                theme="filled"
                className={clsx(
                  "inline-block align-middle ml-2 text-sm",
                  enableBeatSE || "text-dim"
                )}
              />
              <span
                className={clsx(
                  "inline-block w-6 text-center",
                  enableBeatSE || "text-dim"
                )}
              >
                {beatVolume}
              </span>
              <Range
                className="align-middle flex-1 ml-1"
                min={0}
                max={100}
                disabled={!enableBeatSE}
                value={beatVolume}
                onChange={setBeatVolume}
              />
            </div>
          </div>

          {/* 音符の詳細情報表示 */}
          <Box
            classNameOuter="w-full mt-1"
            classNameInner="p-2 text-xs flex flex-col gap-1"
          >
            <div className="font-semibold flex items-center justify-between">
              <span>{t("step")}:</span>
              <span className="font-mono text-sm">{currentStepStr}</span>
            </div>
            <div className="border-t border-slate-300 dark:border-stone-600 pt-1 flex flex-col gap-1 max-h-28 overflow-y-auto">
              {selectedNotes.length === 0 ? (
                <span className="text-dim">{t("noNote")}</span>
              ) : (
                selectedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between font-mono bg-slate-100 dark:bg-stone-800 px-1.5 py-0.5 rounded"
                  >
                    <span>
                      #{note.id + 1}
                      {note.big ? " (Big)" : ""}:
                    </span>
                    <span className="space-x-2">
                      <span>x: {note.hitX}</span>
                      <span>vx: {note.hitVX}</span>
                      <span>vy: {note.hitVY}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </Box>
        </div>

        {/* 左ペイン: FallingWindow */}
        <div className="flex-1 min-w-0 min-h-0 relative">
          <InspectFallingWindow
            className="absolute inset-0"
            chartSeq={chartSeq}
            getCurrentTimeSec={getCurrentTimeSecForFW}
          />
        </div>
      </div>

      {/* 下部: 草と TimeBar */}
      <div
        className="relative w-full overflow-hidden flex-none"
        style={{
          height: isMobile ? 6 * rem : "10vh",
          minHeight: "5.5rem",
          maxHeight: "15vh",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-80">
          <IrasutoyaLikeGrass
            height={
              (isMobile
                ? Math.min(6 * rem, 0.15 * screenHeight)
                : 0.1 * screenHeight) +
              1 * rem
            }
          />
        </div>
        <div className="relative z-10 w-full h-full">
          <TimeBar
            chartSeq={chartSeq}
            currentTimeSec={currentTimeSec}
            setAndSeekCurrentTimeWithoutOffset={
              setAndSeekCurrentTimeWithoutOffset
            }
            zoom={zoom}
          />
        </div>
      </div>
    </main>
  );
}
