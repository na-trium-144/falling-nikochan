"use client";

import clsx from "clsx/lite";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow.js";
import {
  getSignatureState,
  getStep,
  getTimeSec,
} from "@falling-nikochan/chart";
import Button, { ButtonHighlight } from "@/common/button.js";
import TimeBar from "./timeBar.js";
import Input from "@/common/input.js";
import TimingTab from "./timingTab.js";
import NoteTab from "./noteTab.js";
import { Box } from "@/common/box.js";
import { MetaTab } from "./metaTab.js";
import { addRecent } from "@/common/recent.js";
import { convertToPlay, createBrief } from "@falling-nikochan/chart";
import { Step, stepAdd, stepCmp, stepZero } from "@falling-nikochan/chart";
import { MobileHeader } from "@/common/header.js";
import { LuaTabPlaceholder, LuaTabProvider, useLuaExecutor } from "./luaTab.js";
import Select from "@/common/select.js";
import LevelTab from "./levelTab.js";
import { initSession, SessionData } from "@/play/session.js";
import { useDisplayMode } from "@/scale.js";
import Forbid from "@icon-park/react/lib/icons/Forbid";
import Move from "@icon-park/react/lib/icons/Move";
import { GuideMain } from "./guideMain.js";
import { useTranslations } from "next-intl";
import { HelpIcon } from "@/common/caption.js";
import { titleWithSiteName } from "@/common/title.js";
import { SlimeSVG } from "@/common/slime.js";
import {
  historyBackWithReview,
  updatePlayCountForReview,
  useStandaloneDetector,
} from "@/common/pwaInstall.jsx";
import { useSE } from "@/common/se.js";
import { useChartState } from "./chartState.js";
import { PasswdPrompt } from "./passwdPrompt.jsx";
import { useColorThief } from "@/common/colorThief.js";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft.js";

export default function Edit(props: {
  locale: string;
  guideContents: ReactNode[];
}) {
  const { locale } = props;
  const [guidePage, setGuidePage] = useState<number | null>(null);

  const t = useTranslations("edit");
  const { isTouch } = useDisplayMode();
  const standalone = useStandaloneDetector();

  const luaExecutor = useLuaExecutor();

  const {
    chart,
    loadStatus,
    fetchChart,
    savePasswd,
    setSavePasswd,
    saveEditSession,
    saveState,
    remoteSave,
    remoteDelete,
    localSaveState,
    localSave,
    localLoadState,
    localLoad,
  } = useChartState({
    luaExecutor,
    onLoad: (cid) => {
      if (cid === "new") {
        setGuidePage(1);
      } else {
        addRecent("edit", cid);
        history.replaceState(null, "", `/${locale}/edit?cid=${cid}`);
      }
      updatePlayCountForReview();
    },
    locale,
  });
  const currentLevel = chart?.currentLevel;
  const cur = currentLevel?.current;

  useEffect(() => {
    document.title = titleWithSiteName(
      t("title", { title: chart?.meta.title || "", cid: chart?.cid || "" })
    );
    // dependencyなし: 常時実行
  });

  const [sessionId, setSessionId] = useState<number>();
  const [sessionData, setSessionData] = useState<SessionData>();

  useEffect(() => {
    if (sessionId === undefined) {
      setSessionId(initSession(null));
    } else {
      const updateSession = async () => {
        if (chart) {
          const data = {
            cid: chart.cid,
            lvIndex: chart.currentLevelIndex || 0,
            brief: await createBrief(chart.toObject(), new Date().getTime()),
            level: convertToPlay(
              chart.toObject(),
              chart.currentLevelIndex || 0
            ),
            editing: true,
          };
          setSessionData(data);
          initSession(data, sessionId);
          // 譜面の編集時に毎回sessionに書き込む (テストプレイタブのリロードだけで読めるように)
          // 念の為metaTabでテストプレイボタンが押された時にも書き込んでいる
        }
      };
      updateSession();
      chart?.on("change", updateSession);
      chart?.on("levelIndex", updateSession);
      return () => {
        chart?.off("change", updateSession);
        chart?.off("levelIndex", updateSession);
      };
    }
  }, [sessionId, chart]);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (chart?.hasChange) {
        const confirmationMessage = t("confirmUnsaved");

        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [chart, t]);

  const ref = useRef<HTMLDivElement | null>(null);

  const ytPlayer = useRef<YouTubePlayer | undefined>(undefined);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const changePlaybackRate = useCallback((rate: number) => {
    ytPlayer.current?.setPlaybackRate(rate);
  }, []);

  // ytPlayerが再生中
  const [playing, setPlaying] = useState<boolean>(false);
  // ytPlayerが準備完了
  const [ready, setReady] = useState<boolean>(false);
  const onReady = useCallback(() => {
    console.log("ready");
    setReady(true);
  }, []);
  const onStart = useCallback(() => {
    console.log("start");
    setPlaying(true);
  }, []);
  const onStop = useCallback(() => {
    console.log("stop");
    setPlaying(false);
  }, []);
  const start = useCallback(() => {
    if (chart && cur) {
      // scroll中などallowSeekAhead=falseでseekした状態で再生するとカーソル位置がバグる
      ytPlayer.current?.seekTo?.(cur.timeSec + chart.offset, true);
    }
    ytPlayer.current?.playVideo();
    ref.current?.focus();
  }, [chart, cur]);
  const stop = useCallback(() => {
    ytPlayer.current?.pauseVideo();
    ref.current?.focus();
  }, []);
  const setAndSeekCurrentTimeWithoutOffset = useCallback(
    (timeSec: number, focus = true, allowSeekAhead = true) => {
      if (!playing) {
        chart?.setCurrentTimeWithoutOffset(timeSec);
        ytPlayer.current?.seekTo?.(timeSec, allowSeekAhead);
      }
      if (focus) {
        ref.current?.focus();
      }
    },
    [playing, chart]
  );
  const seekStepAbs = useCallback(
    (newStep: Step, focus = false) => {
      // デフォルト引数はluaTabからの呼び出しで使う
      if (chart?.currentLevel) {
        if (stepCmp(newStep, stepZero()) < 0) {
          newStep = stepZero();
        }
        setAndSeekCurrentTimeWithoutOffset(
          getTimeSec(chart.currentLevel.freeze.bpmChanges, newStep) +
            chart.offset,
          focus
        );
      }
      if (focus) {
        ref.current?.focus();
      }
    },
    [chart, setAndSeekCurrentTimeWithoutOffset]
  );
  const seekStepRel = useCallback(
    (move: number) => {
      if (cur?.step && currentLevel) {
        let newStep = stepAdd(cur.step, {
          fourth: 0,
          numerator: move,
          denominator: currentLevel.meta.snapDivider,
        });
        seekStepAbs(newStep, true);
      }
    },
    [cur, currentLevel, seekStepAbs]
  );
  const seekRight1 = useCallback(() => {
    if (currentLevel && cur) {
      if (
        currentLevel?.nextNote &&
        stepCmp(cur?.step, currentLevel.nextNote.step) === 0
      ) {
        currentLevel.selectNextNote();
      } else {
        seekStepRel(1);
      }
    }
    ref.current?.focus();
  }, [cur, currentLevel, seekStepRel]);
  const seekLeft1 = useCallback(() => {
    if (currentLevel && cur) {
      if (
        currentLevel.prevNote &&
        stepCmp(cur?.step, currentLevel.prevNote.step) === 0
      ) {
        currentLevel.selectPrevNote();
      } else {
        seekStepRel(-1);
      }
    }
    ref.current?.focus();
  }, [cur, currentLevel, seekStepRel]);
  const seekSec = useCallback(
    (moveSec: number, focus = true) => {
      if (chart && cur) {
        setAndSeekCurrentTimeWithoutOffset(
          cur?.timeSec + chart.offset + moveSec,
          focus
        );
      }
    },
    [chart, cur, setAndSeekCurrentTimeWithoutOffset]
  );

  useEffect(() => {
    if (playing) {
      const i = setInterval(() => {
        if (ytPlayer.current?.getCurrentTime) {
          chart?.setCurrentTimeWithoutOffset(ytPlayer.current.getCurrentTime());
        }
      }, 50);
      return () => clearInterval(i);
    }
  }, [playing, chart]);

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
  } = useSE(chart?.cid, 0, true, {
    hitVolume: "seVolume",
    hitVolumeCid: chart?.cid ? `seVolume-${chart?.cid}` : undefined,
    enableHitSE: "enableSEEdit",
    beatVolume: "beatVolume",
    beatVolumeCid: chart?.cid ? `beatVolume-${chart?.cid}` : undefined,
    enableBeatSE: "enableBeatEdit",
  });
  const audioLatencyRef = useRef<number>(null!);
  audioLatencyRef.current = audioLatency || 0;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const initSETimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (playing && ytPlayer.current && currentLevel) {
        let index = 0;
        const now =
          ytPlayer.current.getCurrentTime() -
          (chart.offset || 0) +
          audioLatencyRef.current;
        while (
          index < currentLevel.seqNotes.length &&
          currentLevel.seqNotes[index].hitTimeSec < now
        ) {
          index++;
        }
        const playOne = () => {
          if (ytPlayer.current) {
            const now =
              ytPlayer.current.getCurrentTime() -
              (chart?.offset || 0) +
              audioLatencyRef.current;
            timer = null;
            while (
              index < currentLevel!.seqNotes.length &&
              currentLevel!.seqNotes[index].hitTimeSec <= now
            ) {
              playSE(currentLevel!.seqNotes[index].big ? "hitBig" : "hit");
              index++;
            }
            if (index < currentLevel!.seqNotes.length) {
              timer = setTimeout(
                playOne,
                (currentLevel!.seqNotes[index].hitTimeSec - now) * 1000
              );
            }
          }
        };
        if (index < currentLevel!.seqNotes.length) {
          timer = setTimeout(
            playOne,
            (currentLevel!.seqNotes[index].hitTimeSec - now) * 1000
          );
        }
      }
    };
    initSETimer();
    chart?.on("change", initSETimer);
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      chart?.off("change", initSETimer);
    };
  }, [playing, chart, currentLevel, playSE]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const initSETimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (playing && ytPlayer.current && currentLevel) {
        const now =
          ytPlayer.current.getCurrentTime() -
          (chart?.offset || 0) +
          audioLatencyRef.current;
        let step = getStep(currentLevel.freeze.bpmChanges, now, 4);
        const playOne = () => {
          if (ytPlayer.current && currentLevel) {
            const now =
              ytPlayer.current.getCurrentTime() -
              (chart?.offset || 0) +
              audioLatencyRef.current;
            timer = null;
            while (getTimeSec(currentLevel.freeze.bpmChanges, step) <= now) {
              const ss = getSignatureState(currentLevel.freeze.signature, step);
              if (ss.count.numerator === 0 && stepCmp(step, stepZero()) >= 0) {
                playSE(ss.count.fourth === 0 ? "beat1" : "beat");
              }
              step = stepAdd(step, { fourth: 0, numerator: 1, denominator: 4 });
            }
            timer = setTimeout(
              playOne,
              (getTimeSec(currentLevel.freeze.bpmChanges, step) - now) * 1000
            );
          }
        };
        playOne();
      }
    };
    initSETimer();
    chart?.on("change", initSETimer);
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      chart?.off("change", initSETimer);
    };
  }, [playing, playSE, chart, currentLevel]);

  const [tab, setTab] = useState<number>(0);
  const tabNameKeys = ["meta", "timing", "level", "note", "code"];
  const isCodeTab = tab === 4;
  const openGuide = () => setGuidePage([2, 4, 5, 6, 7][tab]);

  const [dragMode, setDragMode] = useState<null | "p" | "v" | "a">(null);
  useEffect(() => {
    if (dragMode === null && !isTouch && chart) {
      setDragMode("p");
    }
  }, [dragMode, isTouch, chart]);

  useEffect(() => {
    if (ytPlayer.current?.getDuration) {
      chart?.setYTDuration(ytPlayer.current.getDuration());
    }
    // dependencyなし: 常時実行
  });

  const [dragOver, setDragOver] = useState<boolean>(false);

  const colorThief = useColorThief();

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (chart && !isCodeTab) {
        if (e.key === " " && !playing) {
          start();
        } else if (
          (e.key === "Escape" || e.key === "Esc" || e.key === " ") &&
          playing
        ) {
          stop();
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
          seekLeft1();
        } else if (e.key === "Right" || e.key === "ArrowRight") {
          seekRight1();
        } else if (e.key === "PageUp" && cur) {
          seekStepRel(-currentLevel.meta.snapDivider * 4);
        } else if (e.key === "PageDown" && cur) {
          seekStepRel(currentLevel.meta.snapDivider * 4);
        } else if (e.key === ",") {
          seekSec(-1 / 30);
        } else if (e.key === ".") {
          seekSec(1 / 30);
        } else if (e.key === "c") {
          chart.copyNote(0);
        } else if (e.key === "v") {
          chart.pasteNote(0);
        } else if (Number(e.key) >= 1) {
          chart.pasteNote(Number(e.key));
        } else if (e.key === "n" && currentLevel?.canAddNote) {
          chart.pasteNote(0, true);
        } else if (
          (e.key === "Backspace" || e.key === "Delete") &&
          currentLevel?.currentNote &&
          currentLevel?.currentNoteEditable
        ) {
          currentLevel?.deleteNote();
        } else if (e.key === "b") {
          if (currentLevel?.currentNote) {
            const n = currentLevel.currentNote;
            currentLevel.updateNote({ ...n, big: !n.big });
          }
        } else if (e.key === "m") {
          if (currentLevel?.currentNote) {
            const n = currentLevel.currentNote;
            currentLevel.updateNote({ ...n, hitX: -n.hitX, hitVX: -n.hitVX });
          }
        } else if (e.key === "Shift") {
          setDragMode("v");
        } else {
          //
        }
      }
    };
    // document.addEventListener() はreactのイベントのstopPropagation()で止まらないので使わない
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [
    chart,
    ready,
    isCodeTab,
    playing,
    start,
    stop,
    seekLeft1,
    seekRight1,
    cur,
    seekStepRel,
    seekSec,
    currentLevel,
  ]);
  return (
    <main
      className={clsx(
        "w-full h-dvh overflow-x-clip overflow-y-auto",
        "edit-wide:overflow-y-clip",
        dragMode !== null && "touch-none"
      )}
      tabIndex={0}
      ref={ref}
      onKeyUp={(e) => {
        if (
          chart &&
          ready &&
          !isCodeTab &&
          (e.key === "Shift" || e.key === "Control")
        ) {
          setDragMode("p");
        }
      }}
      onDragOver={(e) => {
        if (chart !== undefined && tab !== 4) {
          // エディタの読み込みが完了するまでは無効
          e.preventDefault();
          setDragOver(true);
        }
      }}
    >
      <div
        className={clsx(
          "fixed z-edit-mobile-header top-0 inset-x-0",
          "flex edit-wide:hidden flex-row items-center",
          "fn-mh-blur"
        )}
      >
        <MobileHeader className="flex-1 " noBackButton={!standalone}>
          {t("titleShort")} ID: {chart?.cid}
        </MobileHeader>
        <Button text={t("help")} onClick={openGuide} />
      </div>
      <div className="w-0 h-mobile-header edit-wide:hidden" />
      {chart === undefined ? (
        <div
          className={clsx("fn-modal-bg")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-6 grid place-content-center">
            <Box
              classNameOuter={clsx(
                "w-max h-max max-w-full max-h-full",
                "shadow-modal"
              )}
              classNameInner="flex flex-col items-center"
              scrollableY
              padding={6}
            >
              <PasswdPrompt
                loadStatus={loadStatus}
                fetchChart={fetchChart}
                savePasswd={savePasswd}
                setSavePasswd={setSavePasswd}
              />
            </Box>
          </div>
        </div>
      ) : guidePage !== null ? (
        <GuideMain
          content={props.guideContents[guidePage]}
          index={guidePage}
          setIndex={setGuidePage}
          close={() => setGuidePage(null)}
          locale={locale}
        />
      ) : null}

      {dragOver && (
        <div
          className="fn-modal-bg z-edit-dragover-bg"
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = async (event) => {
                await localLoad(event.target!.result as ArrayBuffer);
              };
              reader.readAsArrayBuffer(file);
            }
          }}
        >
          <Box classNameOuter="w-max h-max p-6 shadow-modal">
            <p>{t("dragOver")}</p>
          </Box>
        </div>
      )}

      <LuaTabProvider
        visible={tab === 4}
        chart={chart}
        currentStepStr={cur?.currentStepStr || null}
        seekStepAbs={seekStepAbs}
        errLine={luaExecutor.running ? null : luaExecutor.errLine}
        err={luaExecutor.err}
      >
        <div
          className={clsx(
            "w-full",
            "edit-wide:h-full edit-wide:flex edit-wide:items-stretch edit-wide:justify-center edit-wide:flex-row"
          )}
        >
          <div
            className={clsx(
              "edit-wide:basis-4/12 edit-wide:h-full edit-wide:p-3",
              "min-w-0 grow-0 shrink-0 flex flex-col items-stretch"
            )}
          >
            <div className="hidden edit-wide:flex flex-row items-baseline mb-3 space-x-2">
              {standalone && (
                <button
                  className={clsx("fn-link-1")}
                  onClick={() => {
                    historyBackWithReview();
                  }}
                >
                  <ArrowLeft className="inline-block align-middle mr-2 " />
                  {t("back")}
                </button>
              )}
              <span className="min-w-0 overflow-clip grow-1 flex flex-row items-baseline space-x-2">
                <span className="whitespace-nowrap ">{t("titleShort")}</span>
                <span className="grow-1 whitespace-nowrap ">
                  ID: {chart?.cid}
                </span>
                <span className="min-w-0 overflow-clip shrink-1 whitespace-nowrap text-dim">
                  <span className="">ver.</span>
                  <span className="ml-1">{process.env.buildVersion}</span>
                </span>
              </span>
              <Button text={t("help")} onClick={openGuide} />
            </div>
            <div
              className={clsx(
                "relative grow-0 shrink-0 p-3 rounded-sq-xl flex flex-col items-center",
                // levelBgColors[levelTypes.indexOf(currentLevel?.meta.type || "")] ||
                //   levelBgColors[1],
                chart || "invisible",
                colorThief.boxStyle
              )}
              style={{ color: colorThief.currentColor }}
            >
              <span className={clsx("fn-glass-1")} />
              <span className={clsx("fn-glass-2")} />
              <FlexYouTube
                fixedSide="width"
                className={clsx(
                  "w-full h-max",
                  "edit-wide:w-full edit-wide:h-auto"
                )}
                control={true}
                id={chart?.meta.ytId}
                ytPlayer={ytPlayer}
                onReady={onReady}
                onStart={onStart}
                onStop={onStop}
                onPlaybackRateChange={setPlaybackRate}
              />
              {chart?.meta.ytId && (
                <img
                  ref={colorThief.imgRef}
                  className="hidden"
                  src={`https://i.ytimg.com/vi/${chart?.meta.ytId}/mqdefault.jpg`}
                  crossOrigin="anonymous"
                />
              )}
            </div>
            <div
              className={clsx(
                "relative",
                "w-full aspect-square",
                "edit-wide:flex-1 edit-wide:basis-8/12 edit-wide:aspect-auto"
              )}
            >
              <FallingWindow
                inCodeTab={isCodeTab}
                className="absolute inset-0"
                chart={chart}
                dragMode={dragMode}
                setDragMode={setDragMode}
              />
            </div>
            {chart && isTouch && (
              <button
                className={clsx(
                  "self-start flex flex-row items-center",
                  "fn-link-1"
                )}
                onClick={() => {
                  setDragMode(
                    dragMode === "p" ? "v" : dragMode === "v" ? null : "p"
                  );
                }}
              >
                <span className="relative inline-block w-8 h-8 ">
                  {dragMode === null ? (
                    <>
                      <Move className="absolute text-xl inset-0 w-max h-max m-auto " />
                      <Forbid className="absolute text-3xl inset-0 w-max h-max m-auto " />
                    </>
                  ) : (
                    <>
                      <Move
                        className="absolute text-xl inset-0 w-max h-max m-auto "
                        theme="two-tone"
                        fill={["#333", "#fc5"]}
                      />
                    </>
                  )}
                </span>
                <span className="">
                  {t("touchMode", { mode: dragMode || "null" })}
                </span>
              </button>
            )}
          </div>
          <div
            className={clsx(
              "p-3 flex flex-col items-stretch",
              "h-5/6",
              "min-w-0", // timebarのwidthが大きいので
              "edit-wide:h-full edit-wide:basis-main edit-wide:shrink-1"
            )}
          >
            <div>
              <span className="mr-1">{t("playerControl")}:</span>
              <Select
                options={["0.25", "0.5", "0.75", "1", "1.5", "2"].map((s) => ({
                  label: (
                    <>
                      ×
                      <span className="inline-block text-left ml-1 w-9">
                        {s}
                      </span>
                    </>
                  ),
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
              <span className="inline-block">
                <Button
                  onClick={() => {
                    if (ready && currentLevel) {
                      seekStepRel(-currentLevel.meta.snapDivider * 4);
                    }
                  }}
                  text={t("playerControls.moveStep", {
                    step: -(currentLevel?.meta.snapDivider || 1) * 4,
                  })}
                  keyName="PageUp"
                />
                <Button
                  onClick={() => {
                    if (ready && currentLevel) {
                      seekStepRel(currentLevel.meta.snapDivider * 4);
                    }
                  }}
                  text={t("playerControls.moveStep", {
                    step: (currentLevel?.meta.snapDivider || 1) * 4,
                  })}
                  keyName="PageDn"
                />
              </span>
              <span className="inline-block">
                <Button
                  onClick={() => {
                    if (ready) {
                      seekLeft1();
                    }
                  }}
                  text={t("playerControls.moveStep", { step: -1 })}
                  keyName="←"
                />
                <Button
                  onClick={() => {
                    if (ready) {
                      seekRight1();
                    }
                  }}
                  text={t("playerControls.moveStep", { step: 1 })}
                  keyName="→"
                />
              </span>
              <span className="inline-block">
                <Button
                  onClick={() => {
                    if (ready) {
                      seekSec(-1 / 30);
                    }
                  }}
                  text={t("playerControls.moveMinus1F")}
                  keyName=","
                />
                <Button
                  onClick={() => {
                    if (ready) {
                      seekSec(1 / 30);
                    }
                  }}
                  text={t("playerControls.movePlus1F")}
                  keyName="."
                />
              </span>
            </div>
            <TimeBar
              chart={chart}
              setAndSeekCurrentTimeWithoutOffset={
                setAndSeekCurrentTimeWithoutOffset
              }
            />
            <div className="flex flex-row items-baseline">
              <span>{t("stepUnit")} =</span>
              <span className="ml-2">1</span>
              <span className="ml-1">/</span>
              <Input
                className="w-12"
                actualValue={String((currentLevel?.meta.snapDivider ?? 1) * 4)}
                updateValue={(v: string) => {
                  currentLevel?.updateMeta({ snapDivider: Number(v) / 4 });
                }}
                isValid={(v) =>
                  !isNaN(Number(v)) &&
                  String(Math.floor(Number(v) / 4) * 4) === v
                }
              />
              <HelpIcon className="self-center">
                {t.rich("stepUnitHelp", { br: () => <br /> })}
              </HelpIcon>
              <div className="flex-1" />
              <span className="mr-1">{t("zoom")}</span>
              <Button
                small
                text="-"
                onClick={() => chart?.setZoom(chart.zoom - 1)}
              />
              <Button
                small
                text="+"
                onClick={() => chart?.setZoom(chart.zoom + 1)}
              />
            </div>
            <div className="flex flex-row ml-6 mt-3">
              {tabNameKeys.map((key, i) =>
                i === tab ? (
                  <Box
                    key={i}
                    classNameOuter="sq-unset rounded-t-2xl rounded-b-none px-3 pt-2 pb-1"
                    classNameBorder="border-b-0"
                  >
                    {t(`${key}.title`)}
                  </Box>
                ) : (
                  <button
                    key={i}
                    className={clsx(
                      "rounded-t-2xl px-3 pt-2 pb-1",
                      "fn-flat-button fn-sky"
                    )}
                    onClick={() => {
                      setTab(i);
                      ref.current?.focus();
                    }}
                  >
                    <span className={clsx("fn-glass-1", "border-b-0")} />
                    <span className={clsx("fn-glass-2", "border-b-0")} />
                    <ButtonHighlight />
                    {t(`${key}.title`)}
                  </button>
                )
              )}
            </div>
            <Box
              classNameOuter={clsx(
                "min-h-96",
                "edit-wide:flex-1 edit-wide:min-h-0"
              )}
              classNameInner={clsx("relative")}
              scrollableX
              scrollableY
              padding={3}
            >
              {tab === 0 ? (
                <MetaTab
                  saveEditSession={saveEditSession}
                  sessionId={sessionId}
                  sessionData={sessionData}
                  chart={chart}
                  locale={locale}
                  savePasswd={!!savePasswd}
                  setSavePasswd={setSavePasswd}
                  remoteSave={remoteSave}
                  saveState={saveState}
                  remoteDelete={remoteDelete}
                  localSaveState={localSaveState}
                  localSave={localSave}
                  localLoadState={localLoadState}
                  localLoad={localLoad}
                />
              ) : tab === 1 ? (
                <TimingTab
                  chart={chart}
                  enableHitSE={enableHitSE}
                  setEnableHitSE={setEnableHitSE}
                  hitVolume={hitVolume}
                  setHitVolume={setHitVolume}
                  enableBeatSE={enableBeatSE}
                  setEnableBeatSE={setEnableBeatSE}
                  beatVolume={beatVolume}
                  setBeatVolume={setBeatVolume}
                />
              ) : tab === 2 ? (
                <LevelTab chart={chart} />
              ) : tab === 3 ? (
                <NoteTab chart={chart} />
              ) : null}
              <LuaTabPlaceholder parentContainer={ref.current} />
            </Box>
            <Box
              classNameOuter={clsx(
                "mt-2",
                "bg-gray-500/25",
                !(
                  luaExecutor.running ||
                  luaExecutor.stdout.length > 0 ||
                  luaExecutor.err.length > 0
                ) && "edit-wide:hidden"
              )}
              classNameInner="h-24 max-h-24 edit-wide:h-auto"
              scrollableX
              scrollableY
              padding={3}
            >
              {luaExecutor.running ? (
                <>
                  <span className="inline-block ">
                    <SlimeSVG />
                    {t("running")}
                  </span>
                  <Button
                    className="ml-2"
                    small
                    onClick={luaExecutor.abortExec}
                    text={t("cancel")}
                  />
                </>
              ) : (
                <>
                  {luaExecutor.stdout.map((s, i) => (
                    <p className="text-sm" key={i}>
                      {s}
                    </p>
                  ))}
                  {luaExecutor.err.map((e, i) => (
                    <p
                      className="text-sm text-red-600 dark:text-red-400 "
                      key={i}
                    >
                      {e}
                    </p>
                  ))}
                </>
              )}
            </Box>
          </div>
        </div>
      </LuaTabProvider>
    </main>
  );
}
