"use client";

/*
playページの隠しオプションとしてのクエリパラメーターはqueryOptions.tsを参照
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
import FallingWindow, { FlashPos } from "./fallingWindow.js";
import {
  bigScoreRate,
  chainScoreRate,
  levelTypes,
  RecordGetSummary,
  RecordPost,
  inputTypes,
  emptyBrief,
  Level13Play,
  currentChartVer,
  loadChart,
  ChartSeqData,
} from "@falling-nikochan/chart";
import { YouTubePlayer } from "@/common/youtube.js";
import { ChainDisp, ScoreDisp } from "./score.js";
import RhythmicalSlime from "./rhythmicalSlime.js";
import useGameLogic from "./gameLogic.js";
import { InitErrorMessage, ReadyMessage, StopMessage } from "./messageBox.js";
import StatusBox from "./statusBox.js";
import { useResizeDetector } from "react-resize-detector";
import { ChartBrief } from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
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
import { Key } from "@/common/key.js";
import {
  detectOS,
  historyBackWithReview,
  isStandalone,
  updatePlayCountForReview,
} from "@/common/pwaInstall.js";
import { updateRecordFactor } from "@/common/recordFactor.js";
import { useRealFPS } from "@/common/fpsCalculator.jsx";
import { IrasutoyaLikeGrass } from "@/common/irasutoyaLike.jsx";
import { getQueryOptions, QueryOptions } from "./queryOption.js";
import { ButtonHighlight } from "@/common/button.jsx";
import { APIError } from "@/common/apiError.js";

export function InitPlay({ locale }: { locale: string }) {
  const te = useTranslations("error");

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({});

  const [cid, setCid] = useState<string>();
  const [lvIndex, setLvIndex] = useState<number>();
  const [chartBrief, setChartBrief] = useState<ChartBrief>();
  const [chartSeq, setChartSeq] = useState<ChartSeqData>();
  const [editing, setEditing] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | APIError>();
  useEffect(() => {
    const q = getQueryOptions();
    setQueryOptions(q);

    const session = getSession(q.sid);
    // history.replaceState(null, "", location.pathname);
    if (session !== null) {
      setCid(session.cid);
      setLvIndex(session.lvIndex);
      setChartBrief(session.brief);
      setEditing(!!session.editing);
    } else {
      if (q.cid) {
        setCid(q.cid);
        setLvIndex(q.lvIndex);
        void (async () => setChartBrief((await fetchBrief(q.cid!)).brief))();
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
      setChartSeq(loadChart(session.level));
      setErrorMsg(undefined);
    } else {
      void (async () => {
        try {
          const res = await fetch(
            process.env.BACKEND_PREFIX +
              `/api/playFile/${session?.cid ?? q.cid}` +
              `/${session?.lvIndex ?? q.lvIndex}`,
            { cache: "no-store" }
          );
          if (res.ok) {
            try {
              currentChartVer satisfies 14; // update the code below when chart version is bumped
              const seq = msgpack.decode(await res.arrayBuffer()) as
                | Level6Play
                | Level13Play;
              console.log("seq.ver", seq.ver);
              if (seq.ver === 6 || seq.ver === 13 || seq.ver === 14) {
                switch (seq.ver) {
                  case 6:
                  case 13:
                  case 14:
                    setChartSeq(loadChart(seq));
                    break;
                  default:
                    seq satisfies never;
                }
                setErrorMsg(undefined);
                addRecent("play", session?.cid ?? q.cid ?? "");
                updatePlayCountForReview();
              } else {
                seq.ver satisfies never;
                setChartSeq(undefined);
                setErrorMsg(te("chartVersion", { ver: (seq as any)?.ver }));
              }
            } catch (e) {
              setChartSeq(undefined);
              console.error(e);
              setErrorMsg(APIError.badResponse());
            }
          } else {
            setChartSeq(undefined);
            setErrorMsg(await APIError.fromRes(res));
          }
        } catch (e) {
          setChartSeq(undefined);
          console.error(e);
          setErrorMsg(APIError.fetchError());
        }
      })();
    }
  }, [te]);

  return (
    <Play
      apiErrorMsg={errorMsg}
      cid={cid}
      lvIndex={lvIndex || 0}
      chartBrief={chartBrief}
      chartSeq={chartSeq}
      editing={editing}
      queryOptions={queryOptions}
      locale={locale}
    />
  );
}

interface Props {
  apiErrorMsg?: string | APIError;
  cid?: string;
  lvIndex: number;
  chartBrief?: ChartBrief;
  chartSeq?: ChartSeqData;
  editing: boolean;
  queryOptions: QueryOptions;
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
    queryOptions,
  } = props;
  const te = useTranslations("error");

  const [record, setRecord] = useState<
    RecordGetSummary | APIError | undefined
  >(); // for showing in the result dialog

  const [initAnim, setInitAnim] = useState<boolean>(false);
  useEffect(() => {
    setTimeout(
      () =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setInitAnim(true))
        ),
      100
    );
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
  const [auto, setAuto] = useState<boolean>(false);
  useEffect(() => setAuto(!!queryOptions.auto), [queryOptions]);
  const [autoOffset, setAutoOffset_] = useState<boolean>(false);
  useEffect(() => {
    // デフォルトでtrue
    setAutoOffset_(
      localStorage.getItem("autoOffset") === "1" ||
        localStorage.getItem("autoOffset") === null
    );
  }, []);
  const setAutoOffset = useCallback((v: boolean) => {
    setAutoOffset_(v);
    localStorage.setItem("autoOffset", v ? "1" : "0");
  }, []);
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
  const { isTouch, screenWidth, screenHeight, rem, statusScale, largeResult } =
    useDisplayMode();
  const isMobile = screenWidth < screenHeight;

  const statusSpace = useResizeDetector();
  const statusHide = !isMobile && statusSpace.height === 0;
  const statusOverlaps =
    !isMobile &&
    statusSpace.height &&
    // statusSpace.height < 30 * playUIScale &&
    !statusHide;
  const mainWindowSpace = useResizeDetector();

  const [bestScoreState, setBestScoreState] = useState<number>(0);
  const [bestScoreCounts, setBestScoreCounts] = useState<number[] | null>(null);
  // result表示の際に参照する過去のベストスコア
  const [oldBestScoreState, setOldBestScoreState] = useState<number>(0);
  const [oldBestScoreCounts, setOldBestScoreCounts] = useState<number[] | null>(
    null
  );
  const bestScoreAvailable =
    cid && lvIndex !== undefined && chartBrief?.levels[lvIndex];
  const reloadBestScore = useCallback(() => {
    if (cid && lvIndex !== undefined && chartBrief?.levels[lvIndex]) {
      const data = getBestScore(cid, chartBrief.levels[lvIndex].hash);
      if (data) {
        setBestScoreState(data.baseScore + data.chainScore + data.bigScore);
        setBestScoreCounts([...data.judgeCount, data.bigCount ?? 0]);
      } else {
        setBestScoreState(0);
        setBestScoreCounts(null);
      }
    }
  }, [cid, lvIndex, chartBrief]);
  const initOldBestScore = useCallback(() => {
    setOldBestScoreState(bestScoreState);
    setOldBestScoreCounts(bestScoreCounts);
  }, [bestScoreState, bestScoreCounts]);
  useEffect(reloadBestScore, [reloadBestScore]);

  const [chartPlaying, setChartPlaying] = useState<boolean>(false);
  const [wasAutoPlay, setWasAutoPlay] = useState<boolean>(false); // start時点でautoだったかどうか
  const [oldPlaybackRate, setOldPlaybackRate] = useState<number>(1);
  const [oldUserBegin, setOldUserBegin] = useState<number | null>(null);
  // 終了ボタンが押せるようになる時刻をセット
  const [exitable, setExitable] = useState<DOMHighResTimeStamp | null>(null);
  const exitableNow = useCallback(
    () => exitable && exitable < performance.now(),
    [exitable]
  );

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

  const ytBegin = chartSeq?.ytBegin ?? 0;
  const ytEnd = chartSeq?.ytEndSec ?? 0;
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
  const rawStartTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  const filteredStartTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  const timeStampLastAdjusted = useRef<DOMHighResTimeStamp>(0);
  const getCurrentTimeSec = useCallback(() => {
    if (ytPlayer.current?.getCurrentTime && chartSeq && chartPlaying) {
      const ytNow =
        ytPlayer.current?.getCurrentTime() -
        chartSeq.offset -
        offsetPlusLatency * playbackRate;
      rawStartTimeStamp.current =
        performance.now() - (ytNow * 1000) / playbackRate;
      if (filteredStartTimeStamp.current === null) {
        filteredStartTimeStamp.current = rawStartTimeStamp.current;
      }
      const now =
        ((performance.now() - filteredStartTimeStamp.current) / 1000) *
        playbackRate;
      const dt = (performance.now() - timeStampLastAdjusted.current) / 1000;
      // ずれを少しずつ補正する (ローパスフィルタ)
      filteredStartTimeStamp.current =
        filteredStartTimeStamp.current * Math.exp(-dt / 1.0) +
        rawStartTimeStamp.current * (1 - Math.exp(-dt / 1.0));
      timeStampLastAdjusted.current = performance.now();
      return now;
    }
  }, [chartSeq, chartPlaying, offsetPlusLatency, playbackRate]);

  // キーを押したとき一定時間光らせる
  // ここではnoteのx座標の値そのままを扱う
  const [barFlash, setBarFlash] = useState<FlashPos>(undefined);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashAnimationFrame = useRef<ReturnType<
    typeof requestAnimationFrame
  > | null>(null);
  const flash = useCallback((x: FlashPos) => {
    if (flashAnimationFrame.current !== null) {
      cancelAnimationFrame(flashAnimationFrame.current);
      flashAnimationFrame.current = null;
    }
    if (flashTimeout.current !== null) {
      clearTimeout(flashTimeout.current);
      flashTimeout.current = null;
      setBarFlash(undefined);
      flashAnimationFrame.current = requestAnimationFrame(() => {
        flashAnimationFrame.current = null;
        flash(x);
      });
    } else {
      setBarFlash(x);
      flashTimeout.current = setTimeout(() => {
        flashTimeout.current = null;
        setBarFlash(undefined);
      }, 100);
    }
  }, []);

  const {
    baseScore,
    chainScore,
    bigScore,
    score,
    chain,
    maxChain,
    notesAll,
    resetNotesAll,
    notesDone,
    hit,
    iosRelease,
    judgeCount,
    bigCount,
    bigTotal,
    lateTimes,
    chartEnd,
    hitType,
    posOfs,
    timeOfsEstimator,
  } = useGameLogic(
    getCurrentTimeSec,
    auto,
    !!queryOptions.judgeAuto,
    userOffset,
    autoOffset,
    setUserOffset,
    playbackRate,
    playSE,
    flash
  );

  const { realFps, stable: realFpsStable } = useRealFPS();
  const [runFps, setRunFps] = useState<number>(0);
  const [renderFps, setRenderFps] = useState<number>(0);

  const [shouldHideBPMSign, setShouldHideBPMSign] = useState<boolean>(false);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  // 準備完了画面を表示する (showStoppedとshowResultに優先する)
  const [showReady, setShowReady] = useState<boolean>(false);
  const [openReadyAnim, setOpenReadyAnim] = useState<boolean>(false);
  // スタートボタンを押し、準備完了画面を隠すアニメーションをする
  const [closeReadyAnim, setCloseReadyAnim] = useState<boolean>(false);
  const readyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadingAfterReady, setLoadingAfterReady] = useState<boolean>(false);
  // 譜面を中断した
  const [showStopped, setShowStopped] = useState<boolean>(false);
  // result画面を表示する
  const [showResult, setShowResult] = useState<boolean>(false);
  const [resultDate, setResultDate] = useState<Date>();

  const reset = useCallback(() => setShowReady(true), []);
  const start = useCallback(() => {
    // Space(スタートボタン)が押されたとき
    switch (ytPlayer.current?.getPlayerState()) {
      case 2:
      case 0:
        ytPlayer.current?.seekTo(begin, true);
        ytPlayer.current?.playVideo();
        break;
      case 5:
      default:
        ytPlayer.current?.seekTo(begin, true);
        break;
    }
    // startボタンを押して数秒経っても始まらなかったらloadingを表示
    setCloseReadyAnim(true);
    readyTimeout.current = setTimeout(() => setLoadingAfterReady(true), 1500);
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
  const seekBack = useCallback(() => {
    if (chartPlaying && auto && queryOptions.seek) {
      ytPlayer.current?.seekTo(ytPlayer.current?.getCurrentTime() - 5, true);
    }
  }, [chartPlaying, auto, queryOptions]);
  const seekForward = useCallback(() => {
    if (chartPlaying && auto && queryOptions.seek) {
      ytPlayer.current?.seekTo(ytPlayer.current?.getCurrentTime() + 5, true);
    }
  }, [chartPlaying, auto, queryOptions]);

  // youtube側のreadyイベント & chartSeqが読み込まれる の両方を満たしたら
  // resetを1回呼び、loadingを閉じ、初期化完了となる
  const [ytReady, setYtReady] = useState<boolean>(false);
  const [ytError, setYtError] = useState<number | null>(null);
  const [initDone, setInitDone] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | APIError>();
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const showLoadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [giveUpWaitingFps, setGiveUpWaitingFps] = useState<boolean>(false);
  const giveUpFpsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReadyAll =
    ytReady && !!chartSeq && (realFpsStable || giveUpWaitingFps);
  useEffect(() => {
    if (errorMsg) {
      if (showLoadingTimeout.current !== null) {
        clearTimeout(showLoadingTimeout.current);
      }
      setShowLoading(false);
      setShowReady(false);
      setInitDone(false);
      setExitable(performance.now());
    } else if (isReadyAll && !initDone) {
      if (showLoadingTimeout.current !== null) {
        clearTimeout(showLoadingTimeout.current);
      }
      setShowLoading(false);
      setShowReady(true);
      setTimeout(() => requestAnimationFrame(() => setOpenReadyAnim(true)));
      resetNotesAll(chartSeq.notes, -Infinity);
      ref.current?.focus();
      setInitDone(true);
    } else {
      if (showLoadingTimeout.current === null) {
        showLoadingTimeout.current = setTimeout(
          () => setShowLoading(true),
          1500
        );
      }
      if (
        !giveUpWaitingFps &&
        !realFpsStable &&
        giveUpFpsTimeout.current === null
      ) {
        giveUpFpsTimeout.current = setTimeout(
          () => setGiveUpWaitingFps(true),
          11000
        );
      }
    }
  }, [
    chartSeq,
    realFpsStable,
    giveUpWaitingFps,
    isReadyAll,
    initDone,
    errorMsg,
    resetNotesAll,
  ]);
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
              judgeCount: judgeCount.slice(0, 4) as [
                number,
                number,
                number,
                number,
              ],
              bigCount: bigCount,
              inputType: hitType,
            });
            reloadBestScore();
          }
          (async () => {
            try {
              const res = await fetch(
                process.env.BACKEND_PREFIX + `/api/record/${cid}`
              );
              if (res.ok) {
                try {
                  const records: RecordGetSummary[] = await res.json();
                  setRecord(
                    records.find(
                      (r) => r.lvHash === chartBrief!.levels[lvIndex]?.hash
                    )
                  );
                } catch (e) {
                  console.error(e);
                  setRecord(APIError.badResponse());
                }
              } else {
                setRecord(await APIError.fromRes(res));
              }
            } catch {
              setRecord(APIError.fetchError());
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
    } else if (queryOptions.result) {
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
    queryOptions,
    bigCount,
    hitType,
    editing,
    reloadBestScore,
  ]);

  const onReady = useCallback(() => {
    console.log("ready ->", ytPlayer.current?.getPlayerState());
    setYtReady(true);
    setExitable(performance.now());
  }, []);
  const onStart = useCallback(() => {
    console.log("start ->", ytPlayer.current?.getPlayerState());
    if (chartSeq) {
      initOldBestScore();
      setShowStopped(false);
      setShowReady(false);
      setCloseReadyAnim(false);
      if (readyTimeout.current !== null) {
        clearTimeout(readyTimeout.current);
        readyTimeout.current = null;
      }
      setLoadingAfterReady(false);
      setShowResult(false);
      setChartPlaying(true);
      setWasAutoPlay(auto);
      setOldPlaybackRate(playbackRate);
      setOldUserBegin(userBegin);
      // setChartStarted(true);
      setExitable(null);
      const now =
        (ytPlayer.current?.getCurrentTime() ?? -Infinity) -
        chartSeq.offset -
        offsetPlusLatency * playbackRate;
      resetNotesAll(chartSeq.notes, now);
      lateTimes.current = [];
      ytPlayer.current?.setVolume(ytVolume);
    }
    ref.current?.focus();
    filteredStartTimeStamp.current = null;
  }, [
    chartSeq,
    lateTimes,
    resetNotesAll,
    ytVolume,
    ref,
    initOldBestScore,
    auto,
    playbackRate,
    userBegin,
    offsetPlusLatency,
  ]);
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
    filteredStartTimeStamp.current = null;
  }, [chartPlaying, ref]);
  const onError = useCallback((ec: number) => {
    setYtError(ec);
  }, []);

  useEffect(() => {
    const disableMenu = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", disableMenu);
    return () => document.removeEventListener("contextmenu", disableMenu);
  }, []);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.repeat) {
        return;
      }
      if (e.key === " " && showReady && !chartPlaying) {
        start();
        e.preventDefault();
      } else if (
        e.key === " " &&
        ((showStopped && !showResult) || (showResult && exitableNow()))
      ) {
        setShowReady(true);
        e.preventDefault();
      } else if ((e.key === "Escape" || e.key === "Esc") && chartPlaying) {
        stop();
        e.preventDefault();
      } else if ((e.key === "Escape" || e.key === "Esc") && exitableNow()) {
        exit();
        e.preventDefault();
      } else if (e.key === "Left" || e.key === "ArrowLeft") {
        seekBack();
      } else if (e.key === "Right" || e.key === "ArrowRight") {
        seekForward();
      } else if (isReadyAll && !(chartPlaying && auto)) {
        const candidate = hit(inputTypes.keyboard);
        if (candidate) {
          flash({ targetX: candidate.note.targetX });
        } else {
          flash({ targetX: 0.5 });
        }
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [
    auto,
    chartPlaying,
    exit,
    flash,
    isReadyAll,
    showReady,
    showResult,
    showStopped,
    stop,
    hit,
    start,
    exitableNow,
    seekBack,
    seekForward,
  ]);

  return (
    <main
      className={clsx(
        "overflow-hidden w-full h-dvh relative select-none flex flex-col touch-none"
      )}
      tabIndex={0}
      ref={ref}
      onPointerDown={(e) => {
        if (isReadyAll && !(chartPlaying && auto)) {
          flash({ clientX: e.clientX });
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
          isReadyAll &&
          e.pointerType === "touch" &&
          detectOS() === "ios" &&
          enableIOSThru
        ) {
          iosRelease();
        }
        e.preventDefault();
      }}
    >
      <div
        className={clsx(
          "flex-1 basis-0 min-h-0 w-full overflow-y-visible flex items-stretch",
          isMobile ? "flex-col" : "flex-row-reverse"
        )}
      >
        <div
          className={clsx(
            isMobile || "w-1/3 h-screen overflow-x-visible",
            "flex-none flex flex-col items-stretch"
          )}
        >
          <MusicArea
            className={clsx(
              "isolate z-play-music-area transition-transform duration-500 ease-in-out",
              musicAreaOk ? "translate-y-0" : "translate-y-[-40vw]"
            )}
            ready={musicAreaOk}
            playing={chartPlaying}
            playbackRate={playbackRate}
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
              <div className="grow-1 basis-0" />
              <StatusBox
                className={clsx(
                  "isolate z-play-status flex-none m-3 mt-4.5 mb-0 self-end",
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
                best={
                  bestScoreAvailable
                    ? chartPlaying || (showResult && !showReady)
                      ? oldBestScoreState
                      : bestScoreState
                    : null
                }
                bestCount={
                  chartPlaying || (showResult && !showReady)
                    ? oldBestScoreCounts
                    : bestScoreCounts
                }
                showBestScore={
                  !auto && userBegin === null && playbackRate === 1
                }
                countMode={
                  showReady
                    ? !auto && userBegin === null && playbackRate === 1
                      ? "bestCount"
                      : "grayZero"
                    : "judge"
                }
                showResultDiff={
                  !wasAutoPlay &&
                  oldUserBegin === null &&
                  oldPlaybackRate === 1 &&
                  showResult &&
                  !showReady
                }
              />
              <div
                className="grow-0 shrink-1"
                style={{
                  // 緑の部分の高さ (現在isMobileでないとき10vh) にあわせる
                  flexBasis: "10vh",
                }}
                ref={statusSpace.ref}
              />
            </>
          )}
        </div>
        <div className={clsx("relative flex-1")} ref={mainWindowSpace.ref}>
          {isReadyAll && (
            <FallingWindow
              className="absolute inset-0 isolate z-play-fw"
              notes={notesAll}
              getCurrentTimeSec={getCurrentTimeSec}
              playing={chartPlaying}
              setRunFPS={setRunFps}
              setRenderFPS={setRenderFps}
              barFlash={barFlash}
              noClear={!!queryOptions.noClear}
              playbackRate={playbackRate}
              shouldHideBPMSign={shouldHideBPMSign}
              setShouldHideBPMSign={setShouldHideBPMSign}
              showTSOffset={!!queryOptions.tsOffset}
              rawStartTimeStamp={rawStartTimeStamp}
              filteredStartTimeStamp={filteredStartTimeStamp}
              userOffset={userOffset}
              audioLatency={enableHitSE ? audioLatency : null}
              posOfs={posOfs}
              timeOfsEstimator={timeOfsEstimator}
            />
          )}
          <div
            className={clsx(
              "absolute inset-0 isolate z-play-disp",
              "transition-all duration-300",
              cloudsOk
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-[-300px]"
            )}
          >
            <ScoreDisp
              score={score}
              best={
                !auto && userBegin === null && playbackRate === 1
                  ? chartPlaying || (showResult && !showReady)
                    ? oldBestScoreState
                    : bestScoreState
                  : 0
              }
              auto={auto}
              pc={
                judgeCount[1] +
                  judgeCount[2] +
                  judgeCount[3] +
                  judgeCount[4] ===
                0
              }
              baseScore={baseScore}
              notesDone={notesDone}
            />
            <ChainDisp
              chain={chain}
              maxChain={maxChain}
              playing={chartPlaying}
              fc={judgeCount[2] + judgeCount[3] + judgeCount[4] === 0}
              notesTotal={notesAll.length}
            />
            <div
              className={clsx(
                "absolute inset-x-0",
                "flex justify-center items-center gap-1",
                isMobile ? "top-10" : "top-0"
              )}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <button
                className={clsx("fn-icon-button", isTouch ? "fn-with-bg" : "")}
                onClick={stop}
              >
                <ButtonHighlight />
                <Pause className="inline-block align-middle text-xl" />
                {!isTouch && <Key handleKeyDown>Esc</Key>}
              </button>
              {auto && !isMobile && !isTouch && queryOptions.seek && (
                <>
                  <button
                    className={clsx(
                      "fn-icon-button",
                      isTouch ? "fn-with-bg" : ""
                    )}
                    onClick={seekBack}
                  >
                    <ButtonHighlight />
                    {!isTouch && <Key handleKeyDown>←</Key>}
                    <span className="ml-1 text-base">5s</span>
                  </button>
                  <button
                    className={clsx(
                      "fn-icon-button",
                      isTouch ? "fn-with-bg" : ""
                    )}
                    onClick={seekForward}
                  >
                    <ButtonHighlight />
                    <span className="mr-1 text-base">5s</span>
                    {!isTouch && <Key handleKeyDown>→</Key>}
                  </button>
                </>
              )}
            </div>
          </div>
          {(!initDone || closeReadyAnim) && (
            <CenterBox
              classNameOuter={clsx(
                "isolate z-play-loading",
                "transition-opacity duration-200 ease-out",
                showLoading || loadingAfterReady ? "opacity-100" : "opacity-0"
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
            <InitErrorMessage
              className="isolate z-play-error"
              msg={errorMsg}
              isTouch={isTouch}
              exit={exit}
            />
          )}
          {showReady && (
            <ReadyMessage
              className={clsx(
                "isolate z-play-ready",
                "transition-[scale,opacity] duration-200 ease-out",
                !openReadyAnim && "opacity-0",
                closeReadyAnim && "opacity-0 scale-0"
              )}
              isTouch={isTouch}
              back={showResult ? () => setShowReady(false) : undefined}
              start={start}
              exit={exit}
              auto={auto}
              setAuto={setAuto}
              userOffset={userOffset}
              setUserOffset={setUserOffset}
              autoOffset={autoOffset}
              setAutoOffset={setAutoOffset}
              enableSE={enableHitSE}
              setEnableSE={setEnableHitSE}
              enableIOSThru={enableIOSThru}
              setEnableIOSThru={setEnableIOSThru}
              audioLatency={audioLatency}
              userBegin={userBegin}
              setUserBegin={setUserBegin}
              ytBegin={ytBegin}
              ytEnd={ytEnd}
              playbackRate={playbackRate}
              setPlaybackRate={changePlaybackRate}
              editing={editing}
              lateTimes={lateTimes.current}
              maxHeight={(mainWindowSpace.height || 0) - 10 * rem}
            />
          )}
          {showResult && (
            <Result
              className="isolate z-play-result"
              mainWindowHeight={mainWindowSpace.height!}
              hidden={showReady}
              auto={wasAutoPlay}
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
                queryOptions.result
                  ? exampleResult.baseScore100
                  : Math.floor(baseScore * 100)
              }
              chainScore100={
                queryOptions.result
                  ? exampleResult.chainScore100
                  : Math.floor(chainScore * 100)
              }
              bigScore100={
                queryOptions.result
                  ? exampleResult.bigScore100
                  : Math.floor(bigScore * 100)
              }
              score100={
                queryOptions.result
                  ? exampleResult.score100
                  : Math.floor(score * 100)
              }
              judgeCount={
                queryOptions.result
                  ? exampleResult.judgeCount
                  : (judgeCount.slice(0, 4) as [number, number, number, number])
              }
              bigCount={queryOptions.result ? exampleResult.bigCount : bigCount}
              reset={reset}
              exit={exit}
              isTouch={isTouch}
              showShareButton={!wasAutoPlay && oldUserBegin === null}
              showRecord={
                !wasAutoPlay && oldUserBegin === null && oldPlaybackRate === 1
              }
              newRecord={
                score > oldBestScoreState &&
                !wasAutoPlay &&
                oldUserBegin === null &&
                oldPlaybackRate === 1 &&
                lvIndex !== undefined &&
                chartBrief?.levels[lvIndex] !== undefined
                  ? score - oldBestScoreState
                  : 0
              }
              largeResult={largeResult}
              record={record}
              inputType={hitType}
              playbackRate4={oldPlaybackRate * 4}
            />
          )}
          {showStopped && (
            <StopMessage
              className="isolate z-play-stop"
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
          "transition-transform duration-500 ease-out",
          initAnim ? "" : "translate-y-[30vh] opacity-0"
        )}
        style={{
          height: isMobile ? 6 * statusScale * rem : "10vh",
          maxHeight: "15vh",
        }}
      >
        <IrasutoyaLikeGrass
          height={
            (isMobile
              ? Math.min(6 * statusScale * rem, 0.15 * screenHeight)
              : 0.1 * screenHeight) +
            1 * rem
          }
        />
        {chartSeq && (
          <RhythmicalSlime
            className="isolate z-play-slime absolute"
            style={{
              bottom: "100%",
              right: isMobile
                ? "1rem"
                : statusOverlaps
                  ? 18 * statusScale * rem
                  : "1rem",
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
            "isolate z-play-bpm",
            "transition-opacity duration-500 ease-out",
            initAnim && chartSeq
              ? shouldHideBPMSign
                ? "opacity-25"
                : "opacity-100"
              : "opacity-0"
          )}
          chartPlaying={chartPlaying}
          chartSeq={chartSeq || null}
          getCurrentTimeSec={getCurrentTimeSec}
          hasExplicitSpeedChange={
            hasExplicitSpeedChange && !!queryOptions.speed
          }
          playbackRate={playbackRate}
        />
        {isMobile && (
          <>
            <StatusBox
              className="absolute inset-0 isolate z-play-status"
              style={{
                margin: 1 * statusScale * rem,
              }}
              judgeCount={judgeCount}
              bigCount={bigCount || 0}
              bigTotal={bigTotal}
              notesTotal={notesAll.length}
              isMobile={true}
              isTouch={true /* isTouch がfalseの場合の表示は調整してない */}
              best={
                bestScoreAvailable
                  ? chartPlaying || (showResult && !showReady)
                    ? oldBestScoreState
                    : bestScoreState
                  : null
              }
              bestCount={
                chartPlaying || (showResult && !showReady)
                  ? oldBestScoreCounts
                  : bestScoreCounts
              }
              showBestScore={
                !auto &&
                userBegin === null &&
                playbackRate === 1 &&
                !!bestScoreCounts &&
                showReady
              }
              countMode={
                showReady
                  ? !auto && userBegin === null && playbackRate === 1
                    ? "bestCount"
                    : "grayZero"
                  : "judge"
              }
              showResultDiff={
                !wasAutoPlay &&
                oldUserBegin === null &&
                oldPlaybackRate === 1 &&
                showResult &&
                !showReady
              }
            />
            {queryOptions.fps && (
              <span className="absolute left-3 bottom-full isolate z-play-version">
                [{renderFps} / {runFps} / {Math.round(realFps)}
                {!realFpsStable && "?"} FPS]
              </span>
            )}
          </>
        )}
        {!isMobile && (
          <div className="absolute bottom-2 left-3 opacity-50 isolate z-play-version">
            <span className="inline-block">Falling Nikochan</span>
            <span className="inline-block">
              <span className="ml-2">ver.</span>
              <span className="ml-1">{process.env.buildVersion}</span>
            </span>
            {queryOptions.fps && (
              <span className="inline-block ml-3">
                [{renderFps} / {runFps} / {Math.round(realFps)}
                {!realFpsStable && "?"} FPS]
              </span>
            )}
          </div>
        )}
      </div>
      {!isMobile && statusHide && showResult && !showReady && (
        <div
          className={clsx(
            "isolate z-play-status-overlay absolute inset-y-0 my-auto",
            "grid-centering"
          )}
          style={{ right: "0.75rem" }}
        >
          <StatusBox
            className="h-max"
            judgeCount={judgeCount}
            bigCount={bigCount || 0}
            bigTotal={bigTotal}
            notesTotal={notesAll.length}
            isMobile={false}
            isTouch={isTouch}
            best={bestScoreAvailable ? oldBestScoreState : null}
            bestCount={oldBestScoreCounts}
            showBestScore={
              !wasAutoPlay && oldUserBegin === null && oldPlaybackRate === 1
            }
            countMode={"judge"}
            showResultDiff={
              !wasAutoPlay && oldUserBegin === null && oldPlaybackRate === 1
            }
          />
        </div>
      )}
    </main>
  );
}
