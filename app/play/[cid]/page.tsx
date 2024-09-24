"use client"; // あとでけす

import { useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow";
import { ChartSeqData, loadChart, Note } from "@/chartFormat/seq";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube";
import { ChainDisp, ScoreDisp } from "./score";
import RhythmicalSlime from "./rhythmicalSlime";
import useGameLogic from "./gameLogic";
import { ReadyMessage, StopMessage } from "./messageBox";
import StatusBox from "./statusBox";
import { useResizeDetector } from "react-resize-detector";
import { Chart, ChartBrief } from "@/chartFormat/chart";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import msgpack from "@ygoe/msgpack";
import { stepSub, stepToFloat } from "@/chartFormat/step";
import { Loading, Error } from "@/common/box";
import { useDisplayMode } from "@/scale";
import { addRecent } from "@/common/recent";
import { useRouter, useSearchParams } from "next/navigation";
import Result from "./result";
import { getBestScore, setBestScore } from "@/common/bestScore";

export default function Home(context: { params: Params }) {
  const cid = context.params.cid;
  const searchParams = useSearchParams();
  const router = useRouter();
  const auto = !!Number(searchParams.get("auto"));

  const [chartBrief, setChartBrief] = useState<ChartBrief>();
  const [chartSeq, setChartSeq] = useState<ChartSeqData>();

  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMsg, setErrorMsg] = useState<string>();
  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
      if (res.ok) {
        // cidからタイトルなどを取得
        const resBody = await res.json();
        setChartBrief(resBody);
      }
    })();

    void (async () => {
      const res = await fetch(`/api/seqFile/${cid}`, { cache: "no-store" });
      if (res.ok) {
        try {
          const seq = msgpack.deserialize(await res.arrayBuffer());
          setChartSeq(seq);
          setErrorStatus(undefined);
          setErrorMsg(undefined);
          addRecent("play", cid);
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
        } catch (e) {
          setErrorMsg(String(e));
        }
      }
    })();
  }, [cid]);

  const ref = useRef<HTMLDivElement>(null!);
  const { isMobile, isTouch, scaledSize } = useDisplayMode();

  const [bestScoreState, setBestScoreState] = useState<number>(0);
  const reloadBestScore = useCallback(() => {
    if (!auto) {
      setBestScoreState(getBestScore(cid));
    }
  }, [cid, auto]);
  useEffect(reloadBestScore, [reloadBestScore]);

  // start後true
  const [playing, setPlaying] = useState<boolean>(false);

  const ytPlayer = useRef<YouTubePlayer>();
  // ytPlayerから現在時刻を取得
  // offsetを引いた後の値
  const getCurrentTimeSec = useCallback(() => {
    if (ytPlayer.current?.getCurrentTime && chartSeq && playing) {
      return ytPlayer.current?.getCurrentTime() - chartSeq.offset;
    }
  }, [chartSeq, playing]);
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
  // chart.bpmChanges[setCurrentBpmIndex].step に対応する時刻を保存しておく (計算するには積算しないといけないので)
  const currentBpmChangeTime = useRef<number>(0);
  // bpmを更新
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const now = getCurrentTimeSec();
    if (
      now !== undefined &&
      chartSeq &&
      currentBpmIndex + 1 < chartSeq.bpmChanges.length
    ) {
      const nextBpmChangeTime =
        currentBpmChangeTime.current +
        (60 / chartSeq.bpmChanges[currentBpmIndex].bpm) *
          stepToFloat(
            stepSub(
              chartSeq.bpmChanges[currentBpmIndex + 1].step,
              chartSeq.bpmChanges[currentBpmIndex].step
            )
          );
      timer = setTimeout(() => {
        timer = null;
        currentBpmChangeTime.current = nextBpmChangeTime;
        setCurrentBpmIndex(currentBpmIndex + 1);
      }, (nextBpmChangeTime - currentBpmChangeTime.current) / 1000);
    }
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [chartSeq, currentBpmIndex, getCurrentTimeSec]);

  // ytPlayer準備完了
  const [ready, setReady] = useState<boolean>(false);
  // 停止後 (最初に戻してリセットしてからスタートしないといけない)
  const [stopped, setStopped] = useState<boolean>(false);
  // 少なくとも1回以上startした
  const [playedOnce, setPlayedOnce] = useState<boolean>(false);
  // 終了した
  const [showResult, setShowResult] = useState<boolean>(false);
  useEffect(() => {
    if (chartSeq && playedOnce && end) {
      if (!auto && score > bestScoreState) {
        setBestScore(cid, score);
      }
      const t = setTimeout(() => {
        setShowResult(true);
        stop();
      }, 1000);
      return () => clearTimeout(t);
    } else {
      setShowResult(false);
    }
  }, [playedOnce, end, chartSeq, score, bestScoreState, cid, auto]);

  const onReady = useCallback(() => {
    console.log("ready");
    setReady(true);
    ref.current?.focus();
  }, []);
  const onStart = useCallback(() => {
    console.log("start");
    if (chartSeq) {
      setStopped(false);
      setReady(false);
      resetNotesAll(chartSeq.notes);
      setCurrentBpmIndex(0);
      setPlaying(true);
      setPlayedOnce(true);
      reloadBestScore();
    }
    ref.current?.focus();
  }, [chartSeq, ref, resetNotesAll, reloadBestScore]);
  const onStop = useCallback(() => {
    console.log("stop");
    if (playing) {
      setStopped(true);
      setPlaying(false);
      ytPlayer.current?.seekTo(0, true);
    }
    ref.current?.focus();
  }, [playing, ref]);
  const start = () => {
    if (ytPlayer.current?.playVideo) {
      // なぜか playVideo is not a function な場合がある
      ytPlayer.current?.playVideo();
    }
  };
  const stop = () => {
    if (ytPlayer.current?.pauseVideo) {
      ytPlayer.current?.pauseVideo();
    }
  };
  const exit = () => {
    router.push(`/share/${cid}`);
  };

  // キーを押したとき一定時間光らせる
  const [barFlash, setBarFlash] = useState<boolean>(false);
  const flash = () => {
    setBarFlash(true);
    setTimeout(() => setBarFlash(false), 100);
  };

  if (errorStatus !== undefined || errorMsg !== undefined) {
    return <Error status={errorStatus} message={errorMsg} />;
  }
  if (chartSeq === undefined) {
    return <Loading />;
  }

  return (
    <main
      className="overflow-hidden flex flex-col "
      style={{ ...scaledSize, touchAction: "none" }}
      tabIndex={0}
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === " " && (ready || stopped) && !playing) {
          start();
        } else if ((e.key === "Escape" || e.key === "Esc") && playing) {
          stop();
        } else if ((e.key === "Escape" || e.key === "Esc") && !playing) {
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
          "flex-1 w-full h-full flex items-stretch " +
          (isMobile ? "flex-col" : "flex-row-reverse")
        }
      >
        <div
          className={
            (isMobile ? "flex-none " : "basis-4/12 ") +
            "grow-0 shrink-0 flex flex-col items-stretch"
          }
        >
          <div
            className={
              "z-10 grow-0 shrink-0 p-3 bg-amber-700 rounded-lg flex " +
              (isMobile ? "mt-3 mx-3 flex-row-reverse " : "my-3 mr-3 flex-col ")
            }
          >
            <FlexYouTube
              className={
                "z-10 block " + (isMobile ? "grow-0 shrink-0 basis-6/12" : "")
              }
              isMobile={isMobile}
              id={chartBrief?.ytId}
              control={false}
              ytPlayer={ytPlayer}
              onReady={onReady}
              onStart={onStart}
              onStop={onStop}
            />
            <div className="flex-1">
              <p className="font-title text-lg">{chartBrief?.title}</p>
              <p className="font-title text-sm">{chartBrief?.composer}</p>
              <p className="text-xs">
                <span>Chart by</span>
                <span className="ml-2 font-title text-sm">
                  {chartBrief?.chartCreator}
                </span>
              </p>
            </div>
          </div>
          {/*<div className={"text-right mr-4 " + (isMobile ? "" : "flex-1 ")}>
            {fps} FPS
          </div>*/}
          {!isMobile && (
            <>
              <StatusBox
                className="z-10 grow-0 shrink-0 m-3 self-end"
                judgeCount={judgeCount}
                bigCount={bigCount}
                bigTotal={bigTotal}
                notesTotal={notesAll.length}
                isMobile={false}
                isTouch={isTouch}
              />
              <div className="grow-0 shrink-0 basis-2/12" />
            </>
          )}
        </div>
        <div className={"relative " + (isMobile ? "flex-1 " : "basis-8/12 ")}>
          <FallingWindow
            className="absolute inset-0"
            notes={notesAll}
            getCurrentTimeSec={getCurrentTimeSec}
            playing={playing}
            setFPS={setFps}
            barFlash={barFlash}
          />
          <ScoreDisp
            className="absolute top-0 right-3 "
            score={score}
            best={bestScoreState}
            auto={auto}
          />
          <ChainDisp className="absolute top-0 left-3 " chain={chain} />
          {showResult ? (
            <Result
              baseScore={baseScore}
              chainScore={chainScore}
              bigScore={bigScore}
              score={score}
              start={start}
              exit={exit}
            />
          ) : ready ? (
            <ReadyMessage isTouch={isTouch} start={start} exit={exit} />
          ) : stopped ? (
            <StopMessage isTouch={isTouch} start={start} exit={exit} />
          ) : null}
        </div>
      </div>
      <div className={"relative w-full " + (isMobile ? "h-32 " : "h-16 ")}>
        <div
          className={
            "absolute inset-x-0 bottom-0 " +
            "bg-gradient-to-t from-lime-600 via-lime-500 to-lime-200 "
          }
          style={{ top: -15 }}
        />
        <RhythmicalSlime
          className="absolute "
          style={{ bottom: "100%", right: 15 }}
          num={4}
          getCurrentTimeSec={getCurrentTimeSec}
          playing={playing}
          bpmChanges={chartSeq?.bpmChanges}
        />
        <div className="absolute " style={{ bottom: "100%", left: 15 }}>
          <div
            className="absolute inset-0 m-auto w-4 bg-amber-800 "
            style={{ borderRadius: "100%/6px" }}
          ></div>
          <div
            className={
              "rounded-sm -translate-y-10 p-2 " +
              "bg-gradient-to-t from-amber-700 to-amber-600 " +
              "border-b-2 border-r-2 border-amber-900 " +
              "flex flex-row items-baseline"
            }
          >
            <span className="text-2xl font-title">♩</span>
            <span className="text-xl ml-2 mr-1">=</span>
            <span className="text-right text-3xl w-16">
              {Math.floor(chartSeq?.bpmChanges[currentBpmIndex]?.bpm || 0)}
            </span>
            <span className="text-lg">.</span>
            <span className="text-lg w-3">
              {Math.floor(
                (chartSeq?.bpmChanges[currentBpmIndex]?.bpm || 0) * 10
              ) % 10}
            </span>
          </div>
        </div>
        {isMobile && (
          <StatusBox
            className="absolute inset-4 z-10"
            judgeCount={judgeCount}
            bigCount={bigCount}
            bigTotal={bigTotal}
            notesTotal={notesAll.length}
            isMobile={true}
            isTouch={true /* isTouch がfalseの場合の表示は調整してない */}
          />
        )}
      </div>
    </main>
  );
}
