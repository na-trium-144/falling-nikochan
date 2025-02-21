/*
クエリパラメーター

* sid=セッションID または cid=譜面ID&lvIndex=インデックス で譜面を指定
* fps=1 でFPS表示
* speed=1 で音符の速度変化を表示

*/

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow.js";
import { ChartSeqData6, loadChart6 } from "@/../../chartFormat/legacy/seq6.js";
import { ChartSeqData8, loadChart8 } from "@/../../chartFormat/legacy/seq8.js";
import { YouTubePlayer } from "@/common/youtube.js";
import { ChainDisp, ScoreDisp } from "./score.js";
import RhythmicalSlime from "./rhythmicalSlime.js";
import useGameLogic from "./gameLogic.js";
import { ReadyMessage, StopMessage } from "./messageBox.js";
import StatusBox from "./statusBox.js";
import { useResizeDetector } from "react-resize-detector";
import { ChartBrief } from "@/../../chartFormat/chart.js";
import msgpack from "@ygoe/msgpack";
import { Loading, ErrorPage } from "@/common/box.js";
import { useDisplayMode } from "@/scale.js";
import { addRecent } from "@/common/recent.js";
import Result from "./result.js";
import { getBestScore, setBestScore } from "@/common/bestScore.js";
import BPMSign from "./bpmSign.js";
import { getSession } from "./session.js";
import { MusicArea } from "./musicArea.js";
import { useTheme } from "@/common/theme.js";
import { fetchBrief } from "@/common/briefCache.js";
import { Level6Play } from "../../../chartFormat/legacy/chart6.js";
import { Level8Play } from "../../../chartFormat/legacy/chart8.js";

export function InitPlay({ locale }: { locale: string }) {
  const [showFps, setShowFps] = useState<boolean>(false);
  const [displaySpeed, setDisplaySpeed] = useState<boolean>(false);

  const [cid, setCid] = useState<string>();
  const [lvIndex, setLvIndex] = useState<number>();
  const [chartBrief, setChartBrief] = useState<ChartBrief>();
  const [chartSeq, setChartSeq] = useState<ChartSeqData6 | ChartSeqData8>();
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
        setErrorMsg("Failed to get session data");
        return;
      }
    }
    // document.title =
    //   (session.editing ? "(テストプレイ) " : "") +
    //   pageTitle(session.cid || "-", session.brief) +
    //   " | Falling Nikochan";

    if (session?.level) {
      setChartSeq(loadChart8(session.level));
      setErrorStatus(undefined);
      setErrorMsg(undefined);
    } else {
      void (async () => {
        const res = await fetch(
          process.env.BACKEND_PREFIX +
            `/api/playFile/${session?.cid || cidFromParam}` +
            `/${session?.lvIndex || lvIndexFromParam}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          try {
            const seq: Level6Play | Level8Play = msgpack.deserialize(
              await res.arrayBuffer()
            );
            if (seq.ver === 6 || seq.ver === 8) {
              switch (seq.ver) {
                case 6:
                  setChartSeq(loadChart6(seq));
                  break;
                case 8:
                  setChartSeq(loadChart8(seq));
                  break;
              }
              setErrorStatus(undefined);
              setErrorMsg(undefined);
              addRecent("play", session?.cid || cidFromParam || "");
            } else {
              setChartSeq(undefined);
              setErrorStatus(undefined);
              setErrorMsg(`Invalid chart version: ${(seq as any)?.ver}`);
            }
          } catch (e) {
            setChartSeq(undefined);
            setErrorStatus(undefined);
            setErrorMsg(String(e));
          }
        } else {
          setChartSeq(undefined);
          setErrorStatus(res.status);
          try {
            setErrorMsg(
              String(((await res.json()) as { message?: string }).message)
            );
          } catch {
            setErrorMsg("");
          }
        }
      })();
    }
  }, []);

  if (errorStatus !== undefined || errorMsg !== undefined) {
    return <ErrorPage status={errorStatus} message={errorMsg} />;
  }
  if (chartBrief === undefined || chartSeq === undefined) {
    return <Loading />;
  }

  return (
    <Play
      cid={cid}
      lvIndex={lvIndex || 0}
      chartBrief={chartBrief}
      chartSeq={chartSeq}
      editing={editing}
      showFps={showFps}
      displaySpeed={displaySpeed}
      locale={locale}
    />
  );
}

interface Props {
  cid?: string;
  lvIndex: number;
  chartBrief: ChartBrief;
  chartSeq: ChartSeqData6 | ChartSeqData8;
  editing: boolean;
  showFps: boolean;
  displaySpeed: boolean;
  locale: string;
}
function Play(props: Props) {
  const { cid, lvIndex, chartBrief, chartSeq, editing, showFps, displaySpeed } =
    props;
  const lvType: string =
    (lvIndex !== undefined && chartBrief?.levels[lvIndex]?.type) || "";
  const hasExplicitSpeedChange =
    "speedChanges" in chartSeq &&
    (chartSeq.speedChanges.length !== chartSeq.bpmChanges.length ||
      chartSeq.speedChanges.some(
        (s, i) => s.bpm !== chartSeq.bpmChanges[i].bpm
      ));
  // const [displaySpeed, setDisplaySpeed] = useState<boolean>(false);
  const [auto, setAuto] = useState<boolean>(false);
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
  const themeContext = useTheme();

  const statusSpace = useResizeDetector();
  const statusHide = !isMobile && statusSpace.height === 0;
  const statusOverlaps =
    !isMobile &&
    statusSpace.height &&
    statusSpace.height < 30 * playUIScale &&
    !statusHide;
  const mainWindowSpace = useResizeDetector();
  const readySmall =
    !!mainWindowSpace.height && mainWindowSpace.height < 27 * rem;

  const [bestScoreState, setBestScoreState] = useState<number>(0);
  const reloadBestScore = useCallback(() => {
    if (!auto && cid && lvIndex !== undefined && chartBrief?.levels[lvIndex]) {
      const data = getBestScore(cid, lvIndex);
      if (data && data.levelHash === chartBrief.levels[lvIndex].hash) {
        setBestScoreState(data.baseScore + data.chainScore + data.bigScore);
      }
    }
  }, [cid, auto, lvIndex, chartBrief]);
  useEffect(reloadBestScore, [reloadBestScore]);

  // start後true
  const [chartPlaying, setChartPlaying] = useState<boolean>(false);

  const ytPlayer = useRef<YouTubePlayer>(undefined);

  // ytPlayerから現在時刻を取得
  // offsetを引いた後の値
  const getCurrentTimeSec = useCallback(() => {
    if (ytPlayer.current?.getCurrentTime && chartSeq && chartPlaying) {
      return ytPlayer.current?.getCurrentTime() - chartSeq.offset - userOffset;
    }
  }, [chartSeq, chartPlaying, userOffset]);
  const {
    baseScore,
    chainScore,
    bigScore,
    score,
    chain,
    notesAll,
    resetNotesAll,
    hit,
    judgeCount,
    bigCount,
    bigTotal,
    end,
    lateTimes,
  } = useGameLogic(getCurrentTimeSec, auto, userOffset);

  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  // 準備完了画面を表示する
  const [ready, setReady] = useState<boolean>(false);
  // 譜面を中断した
  const [chartStopped, setChartStopped] = useState<boolean>(false);
  // 譜面をstartした (playingとは異なり、stop後も終了後もtrueのまま)
  const [chartStarted, setChartStarted] = useState<boolean>(false);
  // result画面を表示する
  const [showResult, setShowResult] = useState<boolean>(false);

  const start = () => {
    // 再生中に呼んでもとくになにも起こらない
    if (ytPlayer.current?.getPlayerState() === 0) {
      ytPlayer.current?.seekTo(0, true);
    }
    ytPlayer.current?.playVideo();
    // 譜面の開始はonStart()で処理
  };
  const stop = useCallback(() => {
    if (chartPlaying) {
      setChartStopped(true);
      setChartPlaying(false);
      // 開始時の音量は問答無用で100っぽい?
      for (let i = 1; i < 10; i++) {
        setTimeout(() => {
          ytPlayer.current?.setVolume(((10 - i) * 100) / 10);
        }, i * 100);
        setTimeout(() => {
          ytPlayer.current?.pauseVideo();
        }, 1000);
      }
    }
  }, [chartPlaying]);
  const reset = useCallback(() => {
    setChartStopped(false);
    setChartStarted(false);
    setChartPlaying(false);
    setReady(true);
    resetNotesAll(chartSeq.notes);
    reloadBestScore();
  }, [chartSeq, resetNotesAll, reloadBestScore]);
  const exit = () => {
    // router.replace(`/share/${cid}`);
    // history.back();
    window.close();
  };

  useEffect(() => {
    if (chartStarted && end) {
      if (
        cid &&
        !auto &&
        score > bestScoreState &&
        lvIndex !== undefined &&
        chartBrief?.levels[lvIndex]
      ) {
        setBestScore(cid, lvIndex, {
          levelHash: chartBrief.levels[lvIndex].hash,
          baseScore,
          chainScore,
          bigScore,
          judgeCount,
        });
      }
      const t = setTimeout(() => {
        setShowResult(true);
        stop();
      }, 1000);
      return () => clearTimeout(t);
    } else {
      setShowResult(false);
    }
  }, [
    chartStarted,
    end,
    chartSeq,
    score,
    bestScoreState,
    cid,
    auto,
    lvIndex,
    chartBrief,
    baseScore,
    chainScore,
    bigScore,
    judgeCount,
    stop,
  ]);

  const onReady = useCallback(() => {
    console.log("ready");
    reset();
    ref.current?.focus();
  }, [reset]);
  const onStart = useCallback(() => {
    console.log("start");
    if (chartSeq) {
      setChartStopped(false);
      setReady(false);
      setChartPlaying(true);
      setChartStarted(true);
      lateTimes.current = [];
      ytPlayer.current?.setVolume(100);
    }
    ref.current?.focus();
  }, [chartSeq]);
  const onStop = useCallback(() => {
    console.log("stop");
    if (chartPlaying) {
      setChartStopped(true);
      setChartPlaying(false);
    }
    if (ytPlayer.current?.getPlayerState() === 2) {
      // 終了ではなくpauseの場合のみ
      ytPlayer.current?.seekTo(0, true);
    }
    ref.current?.focus();
  }, [chartPlaying, ref]);

  // キーを押したとき一定時間光らせる
  const [barFlash, setBarFlash] = useState<boolean>(false);
  const flash = () => {
    setBarFlash(true);
    setTimeout(() => setBarFlash(false), 100);
  };

  return (
    <main
      className={
        "overflow-hidden w-full h-dvh relative select-none flex flex-col " +
        (chartPlaying ? "touch-none " : "touch-pan-y ")
      }
      tabIndex={0}
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === " " && ready && !chartPlaying) {
          start();
        } else if (
          e.key === " " &&
          (chartStopped || showResult) &&
          !chartPlaying
        ) {
          reset();
        } else if ((e.key === "Escape" || e.key === "Esc") && chartPlaying) {
          stop();
        } else if ((e.key === "Escape" || e.key === "Esc") && !chartPlaying) {
          exit();
        } else {
          flash();
          hit();
        }
      }}
      onPointerDown={() => {
        flash();
        hit();
      }}
    >
      <div
        className={
          "flex-1 basis-0 min-h-0 w-full overflow-y-visible flex items-stretch " +
          (isMobile ? "flex-col" : "flex-row-reverse")
        }
      >
        <div
          className={
            (isMobile ? "" : "w-1/3 overflow-x-visible ") +
            "flex-none flex flex-col items-stretch"
          }
        >
          <MusicArea
            offset={chartSeq.offset + userOffset}
            lvType={lvType}
            lvIndex={lvIndex}
            isMobile={isMobile}
            ytPlayer={ytPlayer}
            chartBrief={chartBrief}
            onReady={onReady}
            onStart={onStart}
            onStop={onStop}
          />
          {!isMobile && (
            <>
              <StatusBox
                className={
                  "z-10 flex-none m-3 self-end " +
                  (statusHide ? "opacity-0 " : "")
                }
                judgeCount={judgeCount}
                bigCount={bigCount}
                bigTotal={bigTotal}
                notesTotal={notesAll.length}
                isMobile={false}
                isTouch={isTouch}
              />
              <div className="flex-1 basis-0" ref={statusSpace.ref} />
            </>
          )}
        </div>
        <div className={"relative flex-1"} ref={mainWindowSpace.ref}>
          <FallingWindow
            className="absolute inset-0"
            notes={notesAll}
            getCurrentTimeSec={getCurrentTimeSec}
            playing={chartPlaying}
            setFPS={setFps}
            barFlash={barFlash}
            themeContext={themeContext}
          />
          <ScoreDisp score={score} best={bestScoreState} auto={auto} />
          <ChainDisp chain={chain} fc={judgeCount[2] + judgeCount[3] === 0} />
          {showResult ? (
            <Result
              baseScore={baseScore}
              chainScore={chainScore}
              bigScore={bigScore}
              score={score}
              reset={reset}
              exit={exit}
              isTouch={isTouch}
              newRecord={
                score > bestScoreState &&
                !auto &&
                lvIndex !== undefined &&
                chartBrief?.levels[lvIndex] !== undefined
                  ? score - bestScoreState
                  : 0
              }
              largeResult={largeResult}
            />
          ) : ready ? (
            <ReadyMessage
              isTouch={isTouch}
              start={start}
              exit={exit}
              auto={auto}
              setAuto={setAuto}
              userOffset={userOffset}
              setUserOffset={setUserOffset}
              editing={editing}
              lateTimes={lateTimes.current}
              small={readySmall}
            />
          ) : chartStopped ? (
            <StopMessage isTouch={isTouch} reset={reset} exit={exit} />
          ) : null}
        </div>
      </div>
      <div
        className={"relative w-full "}
        style={{
          height: isMobile ? 6 * rem * mobileStatusScale : "10vh",
          maxHeight: "15vh",
        }}
      >
        <div
          className={
            "-z-30 absolute inset-x-0 bottom-0 " +
            "bg-gradient-to-t from-lime-600 via-lime-500 to-lime-200 " +
            "dark:from-lime-900 dark:via-lime-800 dark:to-lime-700 "
          }
          style={{ top: "-1rem" }}
        />
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
        />
        <BPMSign
          chartSeq={chartSeq}
          getCurrentTimeSec={getCurrentTimeSec}
          hasExplicitSpeedChange={hasExplicitSpeedChange && displaySpeed}
        />
        {isMobile && (
          <>
            <StatusBox
              className="absolute inset-0 z-10"
              style={{
                margin: 1 * rem * mobileStatusScale,
              }}
              judgeCount={judgeCount}
              bigCount={bigCount}
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
          bigCount={bigCount}
          bigTotal={bigTotal}
          notesTotal={notesAll.length}
          isMobile={false}
          isTouch={isTouch}
        />
      )}
    </main>
  );
}
