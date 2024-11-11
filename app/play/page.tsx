"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow";
import { ChartSeqData, loadChart } from "@/chartFormat/seq";
import { YouTubePlayer } from "@/common/youtube";
import { ChainDisp, ScoreDisp } from "./score";
import RhythmicalSlime from "./rhythmicalSlime";
import useGameLogic from "./gameLogic";
import { ReadyMessage, StopMessage } from "./messageBox";
import StatusBox from "./statusBox";
import { useResizeDetector } from "react-resize-detector";
import { ChartBrief } from "@/chartFormat/chart";
import msgpack from "@ygoe/msgpack";
import { Loading, Error } from "@/common/box";
import { useDisplayMode } from "@/scale";
import { addRecent } from "@/common/recent";
import { useSearchParams } from "next/navigation";
import Result from "./result";
import { getBestScore, setBestScore } from "@/common/bestScore";
import BPMSign from "./bpmSign";
import { getSession } from "./session";
import { pageTitle } from "@/common/title";
import { MusicArea } from "./musicArea";
import { ThemeHandler, useTheme } from "@/common/theme";

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <InitPlay />
    </Suspense>
  );
}

function InitPlay() {
  const searchParams = useSearchParams();
  const sid = Number(searchParams.get("sid"));
  const showFps = searchParams.get("fps") !== null;

  const [cid, setCid] = useState<string>();
  const [lvIndex, setLvIndex] = useState<number>();
  const [chartBrief, setChartBrief] = useState<ChartBrief>();
  const [chartSeq, setChartSeq] = useState<ChartSeqData>();
  const [editing, setEditing] = useState<boolean>(false);

  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMsg, setErrorMsg] = useState<string>();
  useEffect(() => {
    const session = getSession(sid);
    // history.replaceState(null, "", location.pathname);
    if (session === null) {
      setErrorMsg("Failed to get session data");
      return;
    }
    setCid(session.cid);
    setLvIndex(session.lvIndex);
    setChartBrief(session.brief);
    setEditing(!!session.editing);
    // document.title =
    //   (session.editing ? "(テストプレイ) " : "") +
    //   pageTitle(session.cid || "-", session.brief) +
    //   " | Falling Nikochan";

    if (session.chart) {
      setChartSeq(loadChart(session.chart, session.lvIndex));
      setErrorStatus(undefined);
      setErrorMsg(undefined);
    } else {
      void (async () => {
        const res = await fetch(
          `/api/seqFile/${session.cid}/${session.lvIndex}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          try {
            const seq = msgpack.deserialize(await res.arrayBuffer());
            setChartSeq(seq);
            setErrorStatus(undefined);
            setErrorMsg(undefined);
            addRecent("play", session.cid!);
          } catch (e) {
            setChartSeq(undefined);
            setErrorStatus(undefined);
            setErrorMsg(String(e));
          }
        } else {
          setChartSeq(undefined);
          setErrorStatus(res.status);
          try {
            setErrorMsg(String((await res.json()).message));
          } catch {
            setErrorMsg("");
          }
        }
      })();
    }
  }, [sid]);

  if (errorStatus !== undefined || errorMsg !== undefined) {
    return <Error status={errorStatus} message={errorMsg} />;
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
    />
  );
}

interface Props {
  cid?: string;
  lvIndex: number;
  chartBrief: ChartBrief;
  chartSeq: ChartSeqData;
  editing: boolean;
  showFps: boolean;
}
function Play(props: Props) {
  const { cid, lvIndex, chartBrief, chartSeq, editing, showFps } = props;
  const lvType: string =
    (lvIndex !== undefined && chartBrief?.levels[lvIndex]?.type) || "";

  const [auto, setAuto] = useState<boolean>(false);

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
      return ytPlayer.current?.getCurrentTime() - chartSeq.offset;
    }
  }, [chartSeq, chartPlaying]);
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
  } = useGameLogic(getCurrentTimeSec, auto);

  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  // chart.bpmChanges 内の現在のインデックス
  const [currentBpmIndex, setCurrentBpmIndex] = useState<number>(0);
  // bpmを更新
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const now = getCurrentTimeSec();
    if (
      now !== undefined &&
      chartSeq &&
      currentBpmIndex + 1 < chartSeq.bpmChanges.length
    ) {
      // chartのvalidateでtimesecは再計算されたことが保証されている
      const nextBpmChangeTime =
        chartSeq.bpmChanges[currentBpmIndex + 1].timeSec;
      timer = setTimeout(() => {
        timer = null;
        setCurrentBpmIndex(currentBpmIndex + 1);
      }, (nextBpmChangeTime - now) * 1000);
    }
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [chartSeq, currentBpmIndex, getCurrentTimeSec]);

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
    setCurrentBpmIndex(0);
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

  const [marginTop, setMarginTop] = useState<number>(0);
  useEffect(() => {
    // iOS用。
    // marginBottom=80を追加しユーザーが上にスクロールすることでアドレスバーが消え、その後ゲーム画面をスクロール位置に持ってくる
    // scrollToとかでjavascriptの側からスクロールさせようとすると自動的にアドレスバーが表示されてしまってうまくいかなかった
    if (isTouch) {
      let t: null | ReturnType<typeof setTimeout> = null;
      const onScroll = () => {
        if (t !== null) {
          clearTimeout(t);
        }
        console.log(document.documentElement.scrollTop);
        t = setTimeout(
          () => setMarginTop(document.documentElement.scrollTop),
          50
        );
      };
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, [isTouch]);

  return (
    <main
      className={
        "overflow-hidden w-screen h-screen relative select-none flex flex-col " +
        (chartPlaying ? "touch-none " : "touch-pan-y ")
      }
      style={{ marginTop, marginBottom: isTouch ? 80 : 0 }}
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
            offset={chartSeq.offset}
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
        <div className={"relative flex-1"}>
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
          <ChainDisp chain={chain} />
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
              editing={editing}
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
        <BPMSign currentBpm={chartSeq?.bpmChanges[currentBpmIndex]?.bpm} />
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
          <div className="absolute bottom-2 left-3 opacity-40">
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
