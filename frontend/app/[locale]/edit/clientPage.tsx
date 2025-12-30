"use client";

import clsx from "clsx/lite";
import {
  Chart9Edit,
  findInsertLine,
  NoteCommand,
} from "@falling-nikochan/chart";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow.js";
import {
  findBpmIndexFromStep,
  getSignatureState,
  getStep,
  getTimeSec,
  loadChart,
  Note,
} from "@falling-nikochan/chart";
import Button from "@/common/button.js";
import TimeBar from "./timeBar.js";
import Input from "@/common/input.js";
import TimingTab from "./timingTab.js";
import NoteTab from "./noteTab.js";
import { Box, modalBg } from "@/common/box.js";
import { MetaTab } from "./metaTab.js";
import msgpack from "@ygoe/msgpack";
import { addRecent } from "@/common/recent.js";
import {
  ChartEdit,
  convertToPlay,
  createBrief,
  currentChartVer,
  emptyChart,
  LevelEdit,
  LevelMin,
  levelTypes,
  numEvents,
  validateChart,
} from "@falling-nikochan/chart";
import { Step, stepAdd, stepCmp, stepZero } from "@falling-nikochan/chart";
import { MobileHeader } from "@/common/header.js";
import {
  getPasswd,
  preferSavePasswd,
  setPasswd,
  unsetPasswd,
} from "@/common/passwdCache.js";
import { LuaTabPlaceholder, LuaTabProvider, useLuaExecutor } from "./luaTab.js";
import {
  luaAddBpmChange,
  luaDeleteBpmChange,
  luaUpdateBpmChange,
} from "@falling-nikochan/chart";
import {
  luaAddSpeedChange,
  luaDeleteSpeedChange,
  luaUpdateSpeedChange,
} from "@falling-nikochan/chart";
import {
  luaAddNote,
  luaDeleteNote,
  luaUpdateNote,
} from "@falling-nikochan/chart";
import Select from "@/common/select.js";
import LevelTab from "./levelTab.js";
import { initSession, SessionData } from "@/play/session.js";
import {
  luaAddBeatChange,
  luaDeleteBeatChange,
  luaUpdateBeatChange,
} from "@falling-nikochan/chart";
import { useDisplayMode } from "@/scale.js";
import Forbid from "@icon-park/react/lib/icons/Forbid";
import Move from "@icon-park/react/lib/icons/Move";
import { linkStyle1 } from "@/common/linkStyle.js";
import { GuideMain } from "./guideMain.js";
import { levelBgColors } from "@/common/levelColors.js";
import { Signature } from "@falling-nikochan/chart";
import { Chart5 } from "@falling-nikochan/chart";
import { Chart6 } from "@falling-nikochan/chart";
import { Chart7 } from "@falling-nikochan/chart";
import CheckBox from "@/common/checkBox";
import { useTranslations } from "next-intl";
import { CaptionProvider, HelpIcon } from "@/common/caption.js";
import { titleWithSiteName } from "@/common/title.js";
import { Chart8Edit } from "@falling-nikochan/chart";
import { SlimeSVG } from "@/common/slime.js";
import { useRouter } from "next/navigation.js";
import { updatePlayCountForReview } from "@/common/pwaInstall.jsx";
import { useSE } from "@/common/se.js";
import { useChartState } from "./chartState.js";
import { PasswdPrompt } from "./passwdPrompt.jsx";

export default function Edit(props: {
  locale: string;
  guideContents: ReactNode[];
}) {
  const { locale } = props;
  const [guidePage, setGuidePage] = useState<number | null>(null);

  const t = useTranslations("edit");
  const { isTouch } = useDisplayMode();

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
    }
    const updateSession = async () => {
      if (chart) {
        const data = {
          cid: chart.cid,
          lvIndex: chart.currentLevelIndex || 0,
          brief: await createBrief(chart.toObject(), new Date().getTime()),
          level: convertToPlay(chart.toObject(), chart.currentLevelIndex || 0),
          editing: true,
        };
        setSessionData(data);
        initSession(data, sessionId);
        // 譜面の編集時に毎回sessionに書き込む (テストプレイタブのリロードだけで読めるように)
        // 念の為metaTabでテストプレイボタンが押された時にも書き込んでいる
      }
    };
    chart?.on("changeAnyData", updateSession);
    return () => {
      chart?.off("changeAnyData", updateSession);
    };
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

  const [timeBarPxPerSec, setTimeBarPxPerSec] = useState<number>(300);

  const currentStepStr = chart?.currentLevel?.current.signatureState
    ? chart.currentLevel.current.signatureState.barNum +
      1 +
      ";" +
      (chart.currentLevel.current.signatureState.count.fourth + 1) +
      (chart.currentLevel.current.signatureState.count.numerator > 0
        ? "+" +
          chart.currentLevel.current.signatureState.count.numerator +
          "/" +
          chart.currentLevel.current.signatureState.count.denominator * 4
        : "")
    : null;

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
    ytPlayer.current?.playVideo();
    ref.current?.focus();
  }, []);
  const stop = useCallback(() => {
    ytPlayer.current?.pauseVideo();
    ref.current?.focus();
  }, []);
  const setAndSeekCurrentTimeWithoutOffset = useCallback(
    (timeSec: number, focus = true) => {
      if (!playing) {
        chart?.setCurrentTimeWithoutOffset(timeSec);
        ytPlayer.current?.seekTo?.(timeSec, true);
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
      if (chart?.currentLevel?.current.step) {
        let newStep = stepAdd(chart.currentLevel.current.step, {
          fourth: 0,
          numerator: move,
          denominator: chart.currentLevel.current.snapDivider,
        });
        seekStepAbs(newStep, true);
      }
    },
    [chart, seekStepAbs]
  );
  const seekRight1 = useCallback(() => {
    if (chart?.currentLevel) {
      if (
        chart.currentLevel.hasCurrentNote &&
        chart.currentLevel.current.step &&
        chart.currentLevel.current.noteIndex !== undefined &&
        chart.currentLevel.freeze.notes.at(
          chart.currentLevel.current.noteIndex + 1
        ) &&
        stepCmp(
          chart.currentLevel.current.step,
          chart.currentLevel.freeze.notes.at(
            chart.currentLevel.current.noteIndex + 1
          )!.step
        ) === 0
      ) {
        chart.currentLevel.selectNextNote();
      } else {
        seekStepRel(1);
      }
    }
    ref.current?.focus();
  }, [chart, seekStepRel]);
  const seekLeft1 = useCallback(() => {
    if (chart?.currentLevel) {
      if (
        chart.currentLevel.hasCurrentNote &&
        chart.currentLevel.current.step &&
        chart.currentLevel.current.noteIndex !== undefined &&
        chart.currentLevel.freeze.notes.at(
          chart.currentLevel.current.noteIndex - 1
        ) &&
        stepCmp(
          chart.currentLevel.current.step,
          chart.currentLevel.freeze.notes.at(
            chart.currentLevel.current.noteIndex - 1
          )!.step
        ) === 0
      ) {
        chart.currentLevel.selectPrevNote();
      } else {
        seekStepRel(-1);
      }
    }
    ref.current?.focus();
  }, [chart, seekStepRel]);
  const seekSec = (moveSec: number, focus = true) => {
    if (chart?.currentLevel) {
      setAndSeekCurrentTimeWithoutOffset(
        chart.currentLevel.current.timeSec + chart.offset + moveSec,
        focus
      );
    }
  };

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
      if (playing && ytPlayer.current && chart?.currentLevel) {
        let index = 0;
        const now =
          ytPlayer.current.getCurrentTime() -
          (chart.offset || 0) +
          audioLatencyRef.current;
        while (
          index < chart.currentLevel.seqNotes.length &&
          chart.currentLevel.seqNotes[index].hitTimeSec < now
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
              index < chart.currentLevel!.seqNotes.length &&
              chart.currentLevel!.seqNotes[index].hitTimeSec <= now
            ) {
              playSE(
                chart.currentLevel!.seqNotes[index].big ? "hitBig" : "hit"
              );
              index++;
            }
            if (index < chart.currentLevel!.seqNotes.length) {
              timer = setTimeout(
                playOne,
                (chart.currentLevel!.seqNotes[index].hitTimeSec - now) * 1000
              );
            }
          }
        };
        if (index < chart.currentLevel!.seqNotes.length) {
          timer = setTimeout(
            playOne,
            (chart.currentLevel!.seqNotes[index].hitTimeSec - now) * 1000
          );
        }
      }
    };
    initSETimer();
    chart?.on("changeAnyData", initSETimer);
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      chart?.off("changeAnyData", initSETimer);
    };
  }, [playing, chart, playSE]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const initSETimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (playing && ytPlayer.current && chart?.currentLevel) {
        const now =
          ytPlayer.current.getCurrentTime() -
          (chart?.offset || 0) +
          audioLatencyRef.current;
        let step = getStep(chart.currentLevel.freeze.bpmChanges, now, 4);
        const playOne = () => {
          if (ytPlayer.current && chart.currentLevel) {
            const now =
              ytPlayer.current.getCurrentTime() -
              (chart?.offset || 0) +
              audioLatencyRef.current;
            timer = null;
            while (
              getTimeSec(chart.currentLevel.freeze.bpmChanges, step) <= now
            ) {
              const ss = getSignatureState(
                chart.currentLevel.freeze.signature,
                step
              );
              if (ss.count.numerator === 0 && stepCmp(step, stepZero()) >= 0) {
                playSE(ss.count.fourth === 0 ? "beat1" : "beat");
              }
              step = stepAdd(step, { fourth: 0, numerator: 1, denominator: 4 });
            }
            timer = setTimeout(
              playOne,
              (getTimeSec(chart.currentLevel.freeze.bpmChanges, step) - now) *
                1000
            );
          }
        };
        playOne();
      }
    };
    initSETimer();
    chart?.on("changeAnyData", initSETimer);
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      chart?.off("changeAnyData", initSETimer);
    };
  }, [playing, playSE, chart]);

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

  return (
    <main
      className={clsx(
        "w-full h-dvh overflow-x-clip overflow-y-auto",
        "edit-wide:overflow-y-clip",
        dragMode !== null && "touch-none"
      )}
      tabIndex={0}
      ref={ref}
      onKeyDown={(e) => {
        if (chart && ready && !isCodeTab) {
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
          } else if (e.key === "PageUp" && chart?.currentLevel) {
            seekStepRel(-chart.currentLevel.current.snapDivider * 4);
          } else if (e.key === "PageDown" && chart?.currentLevel) {
            seekStepRel(chart?.currentLevel?.current.snapDivider * 4);
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
          } else if (e.key === "n") {
            chart.pasteNote(0, true);
          } else if (e.key === "b") {
            if (chart?.currentLevel?.hasCurrentNote) {
              const n = chart.currentLevel.currentNote!;
              chart.currentLevel.updateNote({ ...n, big: !n.big });
            }
          } else if (e.key === "Shift") {
            setDragMode("v");
          } else {
            //
          }
        }
      }}
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
        if (chart !== undefined) {
          // エディタの読み込みが完了するまでは無効
          e.preventDefault();
          setDragOver(true);
        }
      }}
    >
      <div
        className={clsx(
          "fixed z-10 top-0 inset-x-0 backdrop-blur-2xs",
          "flex edit-wide:hidden flex-row items-center",
          "bg-gradient-to-t to-70% from-sky-200/0 to-sky-200",
          "dark:from-orange-975/0 dark:to-orange-975"
        )}
      >
        <MobileHeader className="flex-1 ">
          {t("titleShort")} ID: {chart?.cid}
        </MobileHeader>
        <Button text={t("help")} onClick={openGuide} />
      </div>
      <div className="w-0 h-13 edit-wide:hidden" />
      {chart === undefined ? (
        <div className={clsx(modalBg)} onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-6">
            <Box
              className={clsx(
                "absolute inset-0 m-auto w-max h-max max-w-full max-h-full",
                "p-6 overflow-x-clip overflow-y-auto",
                "shadow-lg"
              )}
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
          className={clsx(modalBg, "z-30!")}
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
          <Box className="absolute inset-6 m-auto w-max h-max p-6 shadow-md">
            <p>{t("dragOver")}</p>
          </Box>
        </div>
      )}

      <CaptionProvider>
        <LuaTabProvider
          visible={tab === 4}
          chart={chart}
          currentStepStr={currentStepStr}
          seekStepAbs={seekStepAbs}
          errLine={luaExecutor.running ? null : luaExecutor.errLine}
          err={luaExecutor.err}
        >
          <div
            className={clsx(
              "w-full",
              "edit-wide:h-full edit-wide:flex edit-wide:items-stretch edit-wide:flex-row"
            )}
          >
            <div
              className={clsx(
                "edit-wide:basis-4/12 edit-wide:h-full edit-wide:p-3",
                "min-w-0 grow-0 shrink-0 flex flex-col items-stretch"
              )}
            >
              <div className="hidden edit-wide:flex flex-row items-baseline mb-3 space-x-2">
                <span className="min-w-0 overflow-clip grow-1 flex flex-row items-baseline space-x-2">
                  <span className="text-nowrap ">{t("titleShort")}</span>
                  <span className="grow-1 text-nowrap ">ID: {chart?.cid}</span>
                  <span className="min-w-0 overflow-clip shrink-1 text-nowrap text-slate-500 dark:text-stone-400 ">
                    <span className="">ver.</span>
                    <span className="ml-1">{process.env.buildVersion}</span>
                  </span>
                </span>
                <Button text={t("help")} onClick={openGuide} />
              </div>
              <div
                className={clsx(
                  "grow-0 shrink-0 p-3 rounded-lg flex flex-col items-center",
                  levelBgColors[
                    levelTypes.indexOf(chart?.currentLevel?.meta.type || "")
                  ] || levelBgColors[1],
                  chart || "invisible "
                )}
              >
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
                    linkStyle1
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
                "edit-wide:h-full edit-wide:flex-1"
              )}
            >
              <div>
                <span className="mr-1">{t("playerControl")}:</span>
                <Select
                  options={["✕0.25", "✕0.5", "✕0.75", "✕1", "✕1.5", "✕2"]}
                  values={["0.25", "0.5", "0.75", "1", "1.5", "2"]}
                  value={playbackRate.toString()}
                  onChange={(s: string) => changePlaybackRate(Number(s))}
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
                    playing
                      ? t("playerControls.pause")
                      : t("playerControls.play")
                  }
                  keyName="Space"
                />
                <span className="inline-block">
                  <Button
                    onClick={() => {
                      if (ready && chart?.currentLevel) {
                        seekStepRel(
                          -chart.currentLevel.current.snapDivider * 4
                        );
                      }
                    }}
                    text={t("playerControls.moveStep", {
                      step: chart?.currentLevel
                        ? -chart.currentLevel.current.snapDivider * 4
                        : 4,
                    })}
                    keyName="PageUp"
                  />
                  <Button
                    onClick={() => {
                      if (ready && chart?.currentLevel) {
                        seekStepRel(chart.currentLevel.current.snapDivider * 4);
                      }
                    }}
                    text={t("playerControls.moveStep", {
                      step: chart?.currentLevel
                        ? chart.currentLevel.current.snapDivider * 4
                        : 4,
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
              <div className="flex-none">
                <TimeBar chart={chart} timeBarPxPerSec={timeBarPxPerSec} />
              </div>
              <div className="flex flex-row items-baseline">
                <span>{t("stepUnit")} =</span>
                <span className="ml-2">1</span>
                <span className="ml-1">/</span>
                <Input
                  className="w-12"
                  actualValue={String(
                    (chart?.currentLevel?.current.snapDivider ?? 1) * 4
                  )}
                  updateValue={(v: string) => {
                    chart?.currentLevel?.setSnapDivider(Number(v) / 4);
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
                  text="-"
                  onClick={() => setTimeBarPxPerSec(timeBarPxPerSec / 1.5)}
                />
                <Button
                  text="+"
                  onClick={() => setTimeBarPxPerSec(timeBarPxPerSec * 1.5)}
                />
              </div>
              <div className="flex flex-row ml-3 mt-3">
                {tabNameKeys.map((key, i) =>
                  i === tab ? (
                    <Box key={i} className="rounded-b-none px-3 pt-2 pb-1">
                      {t(`${key}.title`)}
                    </Box>
                  ) : (
                    <button
                      key={i}
                      className="rounded-t-lg px-3 pt-2 pb-1 hover:bg-sky-200 hover:dark:bg-orange-950 active:shadow-inner "
                      onClick={() => {
                        setTab(i);
                        ref.current?.focus();
                      }}
                    >
                      {t(`${key}.title`)}
                    </button>
                  )
                )}
              </div>
              <Box
                className={clsx(
                  "p-3 overflow-auto",
                  "min-h-96 relative",
                  "edit-wide:flex-1 edit-wide:min-h-0"
                )}
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
              <div
                className={clsx(
                  "bg-slate-200 dark:bg-stone-700 mt-2 rounded-sm",
                  "h-24 max-h-24 edit-wide:h-auto overflow-auto"
                )}
              >
                {luaExecutor.running ? (
                  <div className="m-1">
                    <span className="inline-block ">
                      <SlimeSVG />
                      {t("running")}
                    </span>
                    <Button
                      className="ml-2"
                      onClick={luaExecutor.abortExec}
                      text={t("cancel")}
                    />
                  </div>
                ) : (
                  (luaExecutor.stdout.length > 0 ||
                    luaExecutor.err.length > 0) && (
                    <div className="m-1">
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
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </LuaTabProvider>
      </CaptionProvider>
    </main>
  );
}
