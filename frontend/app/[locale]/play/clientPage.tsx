"use client";

/*
クエリパラメーター

* sid=セッションID または cid=譜面ID&lvIndex=インデックス で譜面を指定
* fps=1 でFPS表示
* speed=1 で音符の速度変化を表示
* result=1 でリザルト表示
* auto=1 でオートプレイをデフォルトにする

*/

const exampleResult = {
  baseScore100: 777,
  chainScore100: 2000,
  bigScore100: 123,
  score100: 2900,
  judgeCount: [11, 22, 33, 44],
  bigCount: 55,
} as const;

import clsx from "clsx/lite";
import { useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow.js";
import {
  bigScoreRate,
  chainScoreRate,
  ChartSeqData6,
  levelTypes,
  loadChart6,
  RecordGetSummary,
  RecordPost,
  inputTypes,
  emptyBrief,
  Level13Play,
} from "@falling-nikochan/chart";
import { ChartSeqData13, loadChart13 } from "@falling-nikochan/chart";
import { YouTubePlayer } from "@/common/youtube.js";
import { ChainDisp, ScoreDisp } from "./score.js";
import RhythmicalSlime from "./rhythmicalSlime.js";
import useGameLogic from "./gameLogic.js";
import { InitErrorMessage, ReadyMessage, StopMessage } from "./messageBox.js";
import StatusBox from "./statusBox.js";
import { useResizeDetector } from "react-resize-detector";
import { ChartBrief } from "@falling-nikochan/chart";
import msgpack from "@ygoe/msgpack";
import { CenterBox } from "@/common/box.js";
import { useDisplayMode } from "@/scale.js";
import { addRecent } from "@/common/recent.js";
import Result, { resultAnimDelays } from "./result.js";
import { getBestScore, setBestScore } from "@/common/bestScore.js";
import BPMSign from "./bpmSign.js";
import { getSession } from "./session.js";
import { MusicArea } from "./musicArea.js";
import { fetchBrief } from "@/common/briefCache.js";
import { Level6Play } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { SlimeSVG } from "@/common/slime.js";
import { useSE } from "@/common/se.js";
import Pause from "@icon-park/react/lib/icons/Pause.js";
import { linkStyle1 } from "@/common/linkStyle.js";
import { Key } from "@/common/key.js";
import {
  detectOS,
  historyBackWithReview,
  isStandalone,
  updatePlayCountForReview,
} from "@/common/pwaInstall.js";
import { updateRecordFactor } from "@/common/recordFactor.js";

export function InitPlay({ locale }: { locale: string }) {
  const te = useTranslations("error");

  const [showFps, setShowFps] = useState<boolean>(false);
  const [displaySpeed, setDisplaySpeed] = useState<boolean>(false);
  const [goResult, setGoResult] = useState<boolean>(false);
  const [autoDefault, setAutoDefault] = useState<boolean>(false);

  const [cid, setCid] = useState<string>();
  const [lvIndex, setLvIndex] = useState<number>();
  const [chartBrief, setChartBrief] = useState<ChartBrief>();
  const [chartSeq, setChartSeq] = useState<ChartSeqData6 | ChartSeqData13>();
  const [editing, setEditing] = useState<boolean>(false);

  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMsg, setErrorMsg] = useState<string>();
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sid = Number(searchParams.get("sid"));
    const cidFromParam = searchParams.get("cid");
    const lvIndexFromParam = Number(searchParams.get("lvIndex"));
    setShowFps(searchParams.get("fps") !== null);
    setDisplaySpeed(searchParams.get("speed") !== null);
    setGoResult(searchParams.get("result") !== null);
    setAutoDefault(searchParams.get("auto") !== null);

    const session = getSession(sid);
    // history.replaceState(null, "", location.pathname);
    if (session !== null) {
      setCid(session.cid);
      setLvIndex(session.lvIndex);
      setChartBrief(session.brief);
      setEditing(!!session.editing);
    } else {
      if (cidFromParam) {
        setCid(cidFromParam);
        setLvIndex(lvIndexFromParam);
        void (async () =>
          setChartBrief((await fetchBrief(cidFromParam)).brief))();
        setEditing(false);
      } else {
        setErrorMsg(te("noSession"));
        return;
      }
    }
    // document.title =
    //   (session.editing ? "(テストプレイ) " : "") +
    //   pageTitle(session.cid || "-", session.brief) +
    //   " | Falling Nikochan";

    if (session?.level) {
      setChartSeq(loadChart13(session.level));
      setErrorStatus(undefined);
      setErrorMsg(undefined);
    } else {
      void (async () => {
        try {
          const res = await fetch(
            process.env.BACKEND_PREFIX +
              `/api/playFile/${session?.cid || cidFromParam}` +
              `/${session?.lvIndex || lvIndexFromParam}`,
            { cache: "no-store" }
          );
          if (res.ok) {
            try {
              const seq: Level6Play | Level13Play = msgpack.deserialize(
                await res.arrayBuffer()
              );
              console.log("seq.ver", seq.ver);
              if (seq.ver === 6 || seq.ver === 13) {
                switch (seq.ver) {
                  case 6:
                    setChartSeq(loadChart6(seq));
                    break;
                  case 13:
                    setChartSeq(loadChart13(seq));
                    break;
                }
                setErrorStatus(undefined);
                setErrorMsg(undefined);
                addRecent("play", session?.cid || cidFromParam || "");
                updatePlayCountForReview();
              } else {
                setChartSeq(undefined);
                setErrorStatus(undefined);
                setErrorMsg(te("chartVersion", { ver: (seq as any)?.ver }));
              }
            } catch (e) {
              setChartSeq(undefined);
              setErrorStatus(undefined);
              console.error(e);
              setErrorMsg(te("badResponse"));
            }
          } else {
            setChartSeq(undefined);
            setErrorStatus(res.status);
            try {
              const message = ((await res.json()) as { message?: string })
                .message;
              if (te.has("api." + message)) {
                setErrorMsg(te("api." + message));
              } else {
                setErrorMsg(message || te("unknownApiError"));
              }
            } catch {
              setErrorMsg(te("unknownApiError"));
            }
          }
        } catch (e) {
          setChartSeq(undefined);
          setErrorStatus(undefined);
          console.error(e);
          setErrorMsg(te("api.fetchError"));
        }
      })();
    }
  }, [te]);

  return (
    <Play
      apiErrorMsg={
        errorStatus && errorMsg ? `${errorStatus}: ${errorMsg}` : errorMsg
      }
      cid={cid}
      lvIndex={lvIndex || 0}
      chartBrief={chartBrief}
      chartSeq={chartSeq}
      editing={editing}
      showFps={showFps}
      displaySpeed={displaySpeed}
      goResult={goResult}
      autoDefault={autoDefault}
      locale={locale}
    />
  );
}

interface Props {
  apiErrorMsg?: string;
  cid?: string;
  lvIndex: number;
  chartBrief?: ChartBrief;
  chartSeq?: ChartSeqData6 | ChartSeqData13;
  editing: boolean;
  showFps: boolean;
  displaySpeed: boolean;
  goResult: boolean;
  autoDefault: boolean;
  locale: string;
}
function Play(props: Props) {
  const {
    apiErrorMsg,
    cid,
    lvIndex,
    chartBrief,
    chartSeq,
    editing,
    showFps,
    displaySpeed,
  } = props;
  const te = useTranslations("error");

  const [record, setRecord] = useState<RecordGetSummary | undefined>(); // for showing in the result dialog

  const [initAnim, setInitAnim] = useState<boolean>(false);
  useEffect(() => {
    requestAnimationFrame(() => setInitAnim(true));
  }, []);

  const lvType: string =
    (lvIndex !== undefined && chartBrief?.levels[lvIndex]?.type) || "";
  const musicAreaOk = initAnim && levelTypes.includes(lvType);
  const [cloudsOk, setCloudsOk] = useState<boolean>(false);
  useEffect(() => {
    if (musicAreaOk) {
      setTimeout(() => setCloudsOk(true), 600);
    }
  }, [musicAreaOk]);

  const hasExplicitSpeedChange =
    chartSeq !== undefined &&
    "speedChanges" in chartSeq &&
    (chartSeq.speedChanges.length !== chartSeq.bpmChanges.length ||
      chartSeq.speedChanges.some(
        (s, i) => s.bpm !== chartSeq.bpmChanges[i].bpm
      ));
  // const [displaySpeed, setDisplaySpeed] = useState<boolean>(false);
  const [auto, setAuto] = useState<boolean>(props.autoDefault);
  const [userOffset, setUserOffset_] = useState<number>(0);
  useEffect(() => {
    if (cid) {
      setUserOffset_(Number(localStorage.getItem(`offset-${cid}`)));
    }
  }, [cid]);
  const setUserOffset = useCallback(
    (v: number) => {
      setUserOffset_(v);
      if (cid) {
        localStorage.setItem(`offset-${cid}`, String(v));
      }
    },
    [cid]
  );

  const ref = useRef<HTMLDivElement>(null!);
  const {
    isTouch,
    screenWidth,
    screenHeight,
    rem,
    playUIScale,
    mobileStatusScale,
    largeResult,
  } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;

  const statusSpace = useResizeDetector();
  const statusHide = !isMobile && statusSpace.height === 0;
  const statusOverlaps =
    !isMobile &&
    statusSpace.height &&
    statusSpace.height < 30 * playUIScale &&
    !statusHide;
  const mainWindowSpace = useResizeDetector();

  const [bestScoreState, setBestScoreState] = useState<number>(0);
  const reloadBestScore = useCallback(() => {
    if (cid && lvIndex !== undefined && chartBrief?.levels[lvIndex]) {
      const data = getBestScore(cid, chartBrief.levels[lvIndex].hash);
      if (data) {
        setBestScoreState(data.baseScore + data.chainScore + data.bigScore);
      }
    }
  }, [cid, lvIndex, chartBrief]);
  useEffect(reloadBestScore, [reloadBestScore]);

  const [chartPlaying, setChartPlaying] = useState<boolean>(false);
  // 終了ボタンが押せるようになる時刻をセット
  const [exitable, setExitable] = useState<DOMHighResTimeStamp | null>(null);
  const exitableNow = () => exitable && exitable < performance.now();

  const ytPlayer = useRef<YouTubePlayer>(undefined);
  const [ytVolume, setYtVolume_] = useState<number>(100);
  const setYtVolume = useCallback(
    (v: number) => {
      setYtVolume_(v);
      localStorage.setItem("ytVolume", v.toString());
      if (cid) {
        localStorage.setItem(`ytVolume-${cid}`, v.toString());
      }
      ytPlayer.current?.setVolume(v);
    },
    [cid]
  );
  useEffect(() => {
    const vol = Number(
      localStorage.getItem(`ytVolume-${cid}`) ||
        localStorage.getItem("ytVolume") ||
        100
    );
    setYtVolume_(vol);
    ytPlayer.current?.setVolume(vol);
  }, [cid]);

  const ytBegin = chartSeq && "ytBegin" in chartSeq ? chartSeq.ytBegin : 0;
  const ytEnd =
    chartSeq && "ytEndSec" in chartSeq
      ? chartSeq.ytEndSec
      : chartBrief?.levels.at(lvIndex)?.length ||
        ytPlayer.current?.getDuration() ||
        1;
  const [userBegin, setUserBegin_] = useState<number | null>(null);
  const setUserBegin = useCallback(
    (v: number | null) => {
      setUserBegin_(v);
      if (ytPlayer.current?.getPlayerState() === 2) {
        ytPlayer.current.seekTo(v === null ? ytBegin : v, true);
      }
    },
    [ytBegin]
  );
  const begin = userBegin === null ? ytBegin : userBegin;
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const changePlaybackRate = (rate: number) => {
    ytPlayer.current?.setPlaybackRate(rate);
  };

  const [enableIOSThru, setEnableIOSThru_] = useState<boolean>(false);
  const {
    playSE,
    enableHitSE,
    setEnableHitSE,
    hitVolume,
    setHitVolume,
    audioLatency,
    offsetPlusLatency,
  } = useSE(cid, userOffset, !enableIOSThru, {
    hitVolume: "seVolume",
    hitVolumeCid: cid ? `seVolume-${cid}` : undefined,
    enableHitSE: "enableSE",
  });
  const setEnableIOSThru = useCallback((v: boolean) => {
    setEnableIOSThru_(v);
    localStorage.setItem("enableIOSThru", v ? "1" : "0");
  }, []);
  useEffect(() => {
    if (detectOS() === "ios") {
      const enableIOSThruInitial =
        localStorage.getItem("enableIOSThru") === "1" ||
        localStorage.getItem("enableIOSThru") == null;
      setEnableIOSThru_(enableIOSThruInitial);
    } else {
      setEnableIOSThru_(false);
      localStorage.removeItem("enableIOSThru");
    }
  }, []);

  // ytPlayerから現在時刻を取得
  // 動画基準なのでplaybackRateが1でない場合現実の秒単位とは異なる
  // offsetを引いた後の値
  const ytStartTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  const timeStampLastAdjusted = useRef<DOMHighResTimeStamp>(0);
  const timeStampCumulatedDiff = useRef<number>(0);
  const getCurrentTimeSec = useCallback(() => {
    if (ytPlayer.current?.getCurrentTime && chartSeq && chartPlaying) {
      const ytNow =
        ytPlayer.current?.getCurrentTime() -
        chartSeq.offset -
        offsetPlusLatency * playbackRate;
      if (ytStartTimeStamp.current === null) {
        ytStartTimeStamp.current =
          performance.now() - (ytNow * 1000) / playbackRate;
        timeStampCumulatedDiff.current = 0;
      }
      const now =
        ((performance.now() - ytStartTimeStamp.current) / 1000) * playbackRate;
      const dt = (performance.now() - timeStampLastAdjusted.current) / 1000;
      const diff = ((ytNow - now) * 1000) / playbackRate;
      timeStampCumulatedDiff.current += diff * dt;
      // ずれを少しずつ補正する (PI制御)
      ytStartTimeStamp.current -=
        (1 * diff + 1 * timeStampCumulatedDiff.current) * (1 - Math.exp(-dt));
      timeStampCumulatedDiff.current *= Math.exp(-dt);
      timeStampLastAdjusted.current = performance.now();
      return now;
    }
  }, [chartSeq, chartPlaying, offsetPlusLatency, playbackRate]);
  const {
    baseScore,
    chainScore,
    bigScore,
    score,
    chain,
    notesAll,
    resetNotesAll,
    hit,
    iosRelease,
    judgeCount,
    bigCount,
    bigTotal,
    lateTimes,
    chartEnd,
    hitType,
  } = useGameLogic(getCurrentTimeSec, auto, userOffset, playbackRate, playSE);

  const [fps, setFps] = useState<number>(0);
  // フレームレートが60を超える端末の場合に、60を超えないように制限する
  // 0=制限なし
  const [limitMaxFPS, setLimitMaxFPS_] = useState<number>(60);
  useEffect(() => {
    setLimitMaxFPS_(Number(localStorage.getItem("limitMaxFPS") || 60));
  }, []);
  const setLimitMaxFPS = useCallback((v: number) => {
    setLimitMaxFPS_(v);
    localStorage.setItem("limitMaxFPS", v.toString());
  }, []);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  // 準備完了画面を表示する (showStoppedとshowResultに優先する)
  const [showReady, setShowReady] = useState<boolean>(false);
  // 譜面を中断した
  const [showStopped, setShowStopped] = useState<boolean>(false);
  // result画面を表示する
  const [showResult, setShowResult] = useState<boolean>(props.goResult);
  const [resultDate, setResultDate] = useState<Date>();

  const reset = useCallback(() => setShowReady(true), []);
  const start = useCallback(() => {
    // Space(スタートボタン)が押されたとき
    switch (ytPlayer.current?.getPlayerState()) {
      case 2:
        ytPlayer.current?.seekTo(begin, true);
        ytPlayer.current?.playVideo();
        break;
      default:
        ytPlayer.current?.seekTo(begin, true);
        break;
    }
    // 再生中に呼んでもなにもしない
    playSE("hit"); // ユーザー入力のタイミングで鳴らさないとaudioが有効にならないsafariの対策
    // 譜面のリセットと開始はonStart()で処理
  }, [begin, playSE]);
  const stop = useCallback(() => {
    // Escが押された時&Result表示時
    if (chartPlaying) {
      setShowStopped(true);
      setChartPlaying(false);
      setExitable((ex) => Math.max(ex || 0, performance.now() + 1000));
      for (let i = 1; i < 10; i++) {
        setTimeout(() => {
          ytPlayer.current?.setVolume(((10 - i) * ytVolume) / 10);
        }, i * 100);
        setTimeout(() => {
          ytPlayer.current?.pauseVideo();
        }, 1000);
      }
    }
  }, [chartPlaying, ytVolume]);
  const exit = useCallback(() => {
    // router.replace(`/share/${cid}`);
    if (isStandalone()) {
      historyBackWithReview();
    } else {
      window.close();
    }
  }, []);

  // youtube側のreadyイベント & chartSeqが読み込まれる の両方を満たしたら
  // resetを1回呼び、loadingを閉じ、初期化完了となる
  const [ytReady, setYtReady] = useState<boolean>(false);
  const [ytError, setYtError] = useState<number | null>(null);
  const [initDone, setInitDone] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const showLoadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (errorMsg) {
      if (showLoadingTimeout.current !== null) {
        clearTimeout(showLoadingTimeout.current);
      }
      setShowLoading(false);
      setShowReady(false);
      setInitDone(false);
      setExitable(performance.now());
    } else if (ytReady && chartSeq && !initDone) {
      if (showLoadingTimeout.current !== null) {
        clearTimeout(showLoadingTimeout.current);
      }
      setShowLoading(false);
      setShowReady(true);
      resetNotesAll(chartSeq.notes);
      ref.current?.focus();
      setInitDone(true);
    } else {
      if (showLoadingTimeout.current === null) {
        showLoadingTimeout.current = setTimeout(
          () => setShowLoading(true),
          1500
        );
      }
    }
  }, [ytReady, chartSeq, initDone, errorMsg, resetNotesAll]);
  useEffect(() => {
    if (!errorMsg) {
      if (apiErrorMsg) {
        setErrorMsg(apiErrorMsg);
      } else if (ytError !== null) {
        setErrorMsg(te("ytError", { code: ytError }));
      } else if (chartBrief && !chartBrief.ytId) {
        setErrorMsg(te("noYtId"));
      } else if (chartSeq && chartSeq.notes.length === 0) {
        setErrorMsg(te("seqEmpty"));
      }
    }
  }, [apiErrorMsg, ytError, chartBrief, chartSeq, errorMsg, te]);

  const [endSecPassed, setEndSecPassed] = useState<boolean>(false);
  useEffect(() => {
    if (chartPlaying && chartSeq) {
      if ("ytEndSec" in chartSeq) {
        const checkEnd = () => {
          const ended =
            ytPlayer.current?.getPlayerState() === 0 ||
            (ytPlayer.current?.getCurrentTime() || 0) >= chartSeq.ytEndSec;
          if (ended !== endSecPassed) {
            setEndSecPassed(ended);
          }
        };
        const t = setInterval(checkEnd, 100);
        return () => clearInterval(t);
      } else {
        if (!endSecPassed) {
          setEndSecPassed(true);
        }
      }
    }
  }, [chartPlaying, chartSeq, endSecPassed, getCurrentTimeSec]);
  useEffect(() => {
    if (chartPlaying && chartEnd && endSecPassed) {
      if (!showResult) {
        const newResultDate = new Date();
        if (
          cid &&
          !auto &&
          userBegin === null &&
          playbackRate === 1 &&
          lvIndex !== undefined &&
          chartBrief?.levels.at(lvIndex)
        ) {
          if (score > bestScoreState) {
            setBestScore(cid, chartBrief.levels[lvIndex].hash, {
              date: newResultDate.getTime(),
              baseScore,
              chainScore,
              bigScore,
              judgeCount,
              bigCount: bigCount,
              inputType: hitType,
            });
          }
          void (async () => {
            try {
              const res = await fetch(
                process.env.BACKEND_PREFIX + `/api/record/${cid}`
              );
              if (res.ok) {
                const records: RecordGetSummary[] = await res.json();
                setRecord(
                  records.find(
                    (r) => r.lvHash === chartBrief!.levels[lvIndex]?.hash
                  )
                );
              }
            } catch (e) {
              console.error(e);
            }
          })();
        }
        const t = setTimeout(() => {
          setShowResult(true);
          if (
            userBegin === null &&
            playbackRate === 1 &&
            chartBrief?.levels.at(lvIndex)
          ) {
            try {
              void fetch(process.env.BACKEND_PREFIX + `/api/record/${cid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  lvHash: chartBrief.levels[lvIndex].hash,
                  auto,
                  score,
                  fc: chainScore === chainScoreRate,
                  fb: bigScore === bigScoreRate,
                  editing,
                  factor: updateRecordFactor(
                    cid,
                    chartBrief.levels[lvIndex].hash,
                    auto
                  ),
                } satisfies RecordPost),
                credentials:
                  process.env.NODE_ENV === "development"
                    ? "include"
                    : "same-origin",
              });
            } catch {
              //ignore
            }
          }
          setResultDate(newResultDate);
          setExitable((ex) =>
            Math.max(
              ex || 0,
              performance.now() + resultAnimDelays.reduce((a, b) => a + b, 0)
            )
          );
          stop();
        }, 1000);
        return () => clearTimeout(t);
      }
    } else if (props.goResult) {
      setShowResult(true);
    }
  }, [
    chartPlaying,
    showResult,
    chartEnd,
    endSecPassed,
    chartSeq,
    score,
    bestScoreState,
    cid,
    auto,
    userBegin,
    playbackRate,
    lvIndex,
    chartBrief,
    baseScore,
    chainScore,
    bigScore,
    judgeCount,
    stop,
    props.goResult,
    bigCount,
    hitType,
    editing,
  ]);

  const onReady = useCallback(() => {
    console.log("ready ->", ytPlayer.current?.getPlayerState());
    setYtReady(true);
    setExitable(performance.now());
  }, []);
  const onStart = useCallback(() => {
    console.log("start ->", ytPlayer.current?.getPlayerState());
    if (chartSeq) {
      setShowStopped(false);
      setShowReady(false);
      setShowResult(false);
      setChartPlaying(true);
      // setChartStarted(true);
      setExitable(null);
      reloadBestScore();
      resetNotesAll(chartSeq.notes);
      lateTimes.current = [];
      ytPlayer.current?.setVolume(ytVolume);
    }
    ref.current?.focus();
    ytStartTimeStamp.current = null;
  }, [chartSeq, lateTimes, resetNotesAll, ytVolume, ref, reloadBestScore]);
  const onStop = useCallback(() => {
    console.log("stop ->", ytPlayer.current?.getPlayerState());
    switch (ytPlayer.current?.getPlayerState()) {
      case 0:
        if (chartPlaying) {
          setEndSecPassed(true);
        }
        break;
      case 2:
        if (chartPlaying) {
          setShowStopped(true);
          setChartPlaying(false);
        }
        // ytPlayer.current?.seekTo(begin, true);
        break;
    }
    ref.current?.focus();
    ytStartTimeStamp.current = null;
  }, [chartPlaying, ref]);
  const onError = useCallback((ec: number) => {
    setYtError(ec);
  }, []);

  // キーを押したとき一定時間光らせる
  const [barFlash, setBarFlash] = useState<boolean>(false);
  const flash = () => {
    setBarFlash(true);
    setTimeout(() => setBarFlash(false), 100);
  };

  useEffect(() => {
    const disableMenu = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", disableMenu);
    return () => document.removeEventListener("contextmenu", disableMenu);
  }, []);

  return (
    <main
      className={clsx(
        "overflow-hidden w-full h-dvh relative select-none flex flex-col touch-none"
      )}
      tabIndex={0}
      ref={ref}
      onKeyDown={(e) => {
        if (e.repeat) {
          return;
        }
        if (e.key === " " && showReady && !chartPlaying) {
          start();
        } else if (
          e.key === " " &&
          ((showStopped && !showResult) || (showResult && exitableNow()))
        ) {
          setShowReady(true);
        } else if ((e.key === "Escape" || e.key === "Esc") && chartPlaying) {
          stop();
        } else if ((e.key === "Escape" || e.key === "Esc") && exitableNow()) {
          exit();
        } else if (!(chartPlaying && auto)) {
          flash();
          hit(inputTypes.keyboard);
        }
      }}
      onPointerDown={(e) => {
        if (!(chartPlaying && auto)) {
          flash();
          switch (e.pointerType) {
            case "mouse":
              hit(inputTypes.mouse);
              break;
            case "pen":
              hit(inputTypes.pen);
              break;
            case "touch":
              hit(inputTypes.touch);
              break;
            default:
              console.warn(`unknown pointer type: ${e.pointerType}`);
              hit(0);
              break;
          }
          e.preventDefault();
        }
      }}
      onPointerUp={(e) => {
        if (
          e.pointerType === "touch" &&
          detectOS() === "ios" &&
          enableIOSThru
        ) {
          iosRelease();
        }
        e.preventDefault();
      }}
    >
      {musicAreaOk && (
        <>
          {/* play中に使用する画像を先に読み込んでキャッシュさせる */}
          {[0, 1, 2, 3].map((i) => (
            <img
              src={process.env.ASSET_PREFIX + `/assets/nikochan${i}.svg`}
              className="hidden"
              decoding="async"
              fetchPriority="low"
              key={i}
            />
          ))}
          {[4, 6, 8, 10, 12].map((i) => (
            <img
              src={process.env.ASSET_PREFIX + `/assets/particle${i}.svg`}
              className="hidden"
              decoding="async"
              fetchPriority="low"
              key={i}
            />
          ))}
        </>
      )}
      <div
        className={clsx(
          "flex-1 basis-0 min-h-0 w-full overflow-y-visible flex items-stretch",
          isMobile ? "flex-col" : "flex-row-reverse"
        )}
      >
        <div
          className={clsx(
            isMobile || "w-1/3 overflow-x-visible",
            "flex-none flex flex-col items-stretch"
          )}
        >
          <MusicArea
            className={clsx(
              "z-20 transition-transform duration-500 ease-in-out",
              musicAreaOk ? "translate-y-0" : "translate-y-[-40vw]"
            )}
            ready={musicAreaOk}
            playing={chartPlaying}
            ytBeginSec={ytBegin}
            offset={(chartSeq?.offset || 0) + offsetPlusLatency}
            lvType={lvType}
            lvIndex={lvIndex}
            isMobile={isMobile}
            isTouch={isTouch}
            ytPlayer={ytPlayer}
            chartBrief={chartBrief}
            onReady={onReady}
            onStart={onStart}
            onStop={onStop}
            onError={onError}
            onPlaybackRateChange={setPlaybackRate}
            ytVolume={ytVolume}
            setYtVolume={setYtVolume}
            enableSE={enableHitSE && !enableIOSThru}
            seVolume={hitVolume}
            setSEVolume={setHitVolume}
          />
          {!isMobile && (
            <>
              <StatusBox
                className={clsx(
                  "z-10 flex-none m-3 self-end",
                  "transition-opacity duration-100",
                  !statusHide && musicAreaOk && notesAll.length > 0
                    ? "ease-in opacity-100"
                    : "ease-out opacity-0"
                )}
                judgeCount={judgeCount}
                bigCount={bigCount || 0}
                bigTotal={bigTotal}
                notesTotal={notesAll.length}
                isMobile={false}
                isTouch={isTouch}
              />
              <div className="flex-1 basis-0" ref={statusSpace.ref} />
            </>
          )}
        </div>
        <div className={clsx("relative flex-1")} ref={mainWindowSpace.ref}>
          <FallingWindow
            limitMaxFPS={limitMaxFPS}
            className="absolute inset-0"
            notes={notesAll}
            getCurrentTimeSec={getCurrentTimeSec}
            playing={chartPlaying}
            setFPS={setFps}
            barFlash={barFlash}
          />
          <div
            className={clsx(
              "absoulte inset-0",
              "transition-all duration-200",
              cloudsOk
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-[-300px]"
            )}
          >
            <ScoreDisp
              score={score}
              best={bestScoreState}
              auto={auto}
              playbackRate={playbackRate}
            />
            <ChainDisp chain={chain} fc={judgeCount[2] + judgeCount[3] === 0} />
            <button
              className={clsx(
                "absolute rounded-full cursor-pointer leading-1",
                "top-0 inset-x-0 mx-auto w-max text-xl",
                isTouch ? "bg-white/50 dark:bg-stone-800/50 p-2" : "py-2 px-1",
                isMobile && "mt-10",
                "hover:bg-slate-200/50 active:bg-slate-300/50",
                "hover:dark:bg-stone-700/50 active:dark:bg-stone-600/50",
                linkStyle1
              )}
              onClick={stop}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <Pause className="inline-block align-middle " />
              {!isTouch && (
                <Key className="text-xs p-0.5 mx-1 align-middle ">Esc</Key>
              )}
            </button>
          </div>
          {!initDone && (
            <CenterBox
              className={clsx(
                "transition-opacity duration-200 ease-out",
                showLoading ? "opacity-100" : "opacity-0"
              )}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <p>
                <SlimeSVG />
                Loading...
              </p>
            </CenterBox>
          )}
          {errorMsg && (
            <InitErrorMessage msg={errorMsg} isTouch={isTouch} exit={exit} />
          )}
          {showReady && (
            <ReadyMessage
              isTouch={isTouch}
              back={showResult ? () => setShowReady(false) : undefined}
              start={start}
              exit={exit}
              auto={auto}
              setAuto={setAuto}
              userOffset={userOffset}
              setUserOffset={setUserOffset}
              enableSE={enableHitSE}
              setEnableSE={setEnableHitSE}
              enableIOSThru={enableIOSThru}
              setEnableIOSThru={setEnableIOSThru}
              audioLatency={audioLatency}
              limitMaxFPS={limitMaxFPS}
              setLimitMaxFPS={setLimitMaxFPS}
              userBegin={userBegin}
              setUserBegin={setUserBegin}
              ytBegin={ytBegin}
              ytEnd={ytEnd}
              playbackRate={playbackRate}
              setPlaybackRate={changePlaybackRate}
              editing={editing}
              lateTimes={lateTimes.current}
              maxHeight={(mainWindowSpace.height || 0) - 12 * rem}
            />
          )}
          {showResult && (
            <Result
              mainWindowHeight={mainWindowSpace.height!}
              hidden={showReady}
              auto={auto}
              optionChanged={
                userBegin !== null &&
                Math.round(userBegin) > Math.round(ytBegin)
              }
              lang={props.locale}
              date={resultDate || new Date(2025, 6, 1)}
              cid={cid || ""}
              brief={chartBrief || emptyBrief()}
              lvName={chartBrief?.levels.at(lvIndex || 0)?.name || ""}
              lvType={levelTypes.indexOf(
                chartBrief?.levels.at(lvIndex || 0)?.type || ""
              )}
              lvDifficulty={
                chartBrief?.levels.at(lvIndex || 0)?.difficulty || 0
              }
              baseScore100={
                props.goResult
                  ? exampleResult.baseScore100
                  : Math.floor(baseScore * 100)
              }
              chainScore100={
                props.goResult
                  ? exampleResult.chainScore100
                  : Math.floor(chainScore * 100)
              }
              bigScore100={
                props.goResult
                  ? exampleResult.bigScore100
                  : Math.floor(bigScore * 100)
              }
              score100={
                props.goResult
                  ? exampleResult.score100
                  : Math.floor(score * 100)
              }
              judgeCount={
                props.goResult ? exampleResult.judgeCount : judgeCount
              }
              bigCount={props.goResult ? exampleResult.bigCount : bigCount}
              reset={reset}
              exit={exit}
              isTouch={isTouch}
              newRecord={
                score > bestScoreState &&
                !auto &&
                playbackRate === 1 &&
                lvIndex !== undefined &&
                chartBrief?.levels[lvIndex] !== undefined
                  ? score - bestScoreState
                  : 0
              }
              largeResult={largeResult}
              record={record}
              inputType={hitType}
              playbackRate4={playbackRate * 4}
            />
          )}
          {showStopped && (
            <StopMessage
              hidden={showReady || showResult}
              isTouch={isTouch}
              reset={reset}
              exit={exit}
            />
          )}
        </div>
      </div>
      <div
        className={clsx(
          "relative w-full",
          "transition-transform duration-200 ease-out",
          initAnim ? "translate-y-0" : "translate-y-[30vh]"
        )}
        style={{
          height: isMobile ? 6 * rem * mobileStatusScale : "10vh",
          maxHeight: "15vh",
        }}
      >
        <div
          className={clsx(
            "-z-30 absolute inset-x-0 bottom-0",
            "bg-lime-500 bg-gradient-to-t from-lime-600 via-lime-500 to-lime-200",
            "dark:bg-lime-800 dark:from-lime-900 dark:via-lime-800 dark:to-lime-700"
          )}
          style={{ top: "-1rem" }}
        />
        {chartSeq && (
          <RhythmicalSlime
            className="-z-10 absolute "
            style={{
              bottom: "100%",
              right: isMobile ? "1rem" : statusOverlaps ? 15 * rem : "1rem",
            }}
            signature={chartSeq.signature}
            getCurrentTimeSec={getCurrentTimeSec}
            playing={chartPlaying}
            bpmChanges={chartSeq?.bpmChanges}
            playbackRate={playbackRate}
          />
        )}
        <BPMSign
          className={clsx(
            "transition-opacity duration-200 ease-out",
            initAnim && chartSeq ? "opacity-100" : "opacity-0"
          )}
          chartPlaying={chartPlaying}
          chartSeq={chartSeq || null}
          getCurrentTimeSec={getCurrentTimeSec}
          hasExplicitSpeedChange={hasExplicitSpeedChange && displaySpeed}
          playbackRate={playbackRate}
        />
        {isMobile && (
          <>
            <StatusBox
              className="absolute inset-0 z-10"
              style={{
                margin: 1 * rem * mobileStatusScale,
              }}
              judgeCount={judgeCount}
              bigCount={bigCount || 0}
              bigTotal={bigTotal}
              notesTotal={notesAll.length}
              isMobile={true}
              isTouch={true /* isTouch がfalseの場合の表示は調整してない */}
            />
            {showFps && (
              <span className="absolute left-3 bottom-full">[{fps} FPS]</span>
            )}
          </>
        )}
        {!isMobile && (
          <div className="absolute bottom-2 left-3 opacity-50">
            <span className="inline-block">Falling Nikochan</span>
            <span className="inline-block">
              <span className="ml-2">ver.</span>
              <span className="ml-1">{process.env.buildVersion}</span>
            </span>
            {showFps && <span className="inline-block ml-3">[{fps} FPS]</span>}
          </div>
        )}
      </div>
      {!isMobile && statusHide && showResult && (
        <StatusBox
          className="z-20 absolute my-auto h-max inset-y-0"
          style={{ right: "0.75rem" }}
          judgeCount={judgeCount}
          bigCount={bigCount || 0}
          bigTotal={bigTotal}
          notesTotal={notesAll.length}
          isMobile={false}
          isTouch={isTouch}
        />
      )}
    </main>
  );
}
