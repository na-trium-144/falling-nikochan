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
import BPMSign from "./bpmSign";

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
        } catch {
          setErrorMsg("");
        }
      }
    })();
  }, [cid]);

  const ref = useRef<HTMLDivElement>(null!);
  const { isTouch, screenWidth, screenHeight, rem, playUIScale } =
    useDisplayMode();
  const isMobile = screenWidth < screenHeight;

  const statusSpace = useResizeDetector();
  const statusHide = !isMobile && statusSpace.height === 0;
  const statusOverlaps =
    !isMobile &&
    statusSpace.height &&
    statusSpace.height < 30 * playUIScale &&
    !statusHide;

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
    router.replace(`/share/${cid}`);
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
      className="overflow-hidden w-screen h-screen relative select-none"
      style={{ touchAction: "none" }}
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
          "w-full overflow-y-visible flex items-stretch " +
          (isMobile ? "flex-col" : "flex-row-reverse")
        }
        style={{
          height: isMobile ? screenHeight - 6 * rem : screenHeight * 0.9,
        }}
      >
        <div
          className={
            (isMobile ? "" : "w-1/3 overflow-x-visible ") +
            "flex-none flex flex-col items-stretch"
          }
        >
          <div
            className={
              "z-10 grow-0 shrink-0 p-3 bg-amber-600 rounded-lg flex " +
              (isMobile ? "mt-3 mx-3 flex-row-reverse " : "my-3 mr-3 flex-col ")
            }
          >
            <FlexYouTube
              fixedSide="width"
              className={
                "z-10 " + (isMobile ? "grow-0 shrink-0 basis-6/12" : "w-full")
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
            playing={playing}
            setFPS={setFps}
            barFlash={barFlash}
          />
          <ScoreDisp score={score} best={bestScoreState} auto={auto} />
          <ChainDisp chain={chain} />
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
      <div
        className={"relative w-full "}
        style={{ height: isMobile ? "6rem" : "10%" }}
      >
        <div
          className={
            "-z-20 absolute inset-x-0 bottom-0 " +
            "bg-gradient-to-t from-lime-600 via-lime-500 to-lime-200 "
          }
          style={{ top: "-1rem" }}
        />
        <RhythmicalSlime
          className="-z-10 absolute "
          style={{
            bottom: "100%",
            right: isMobile ? "1rem" : statusOverlaps ? 15 * rem : "1rem",
          }}
          num={4}
          getCurrentTimeSec={getCurrentTimeSec}
          playing={playing}
          bpmChanges={chartSeq?.bpmChanges}
        />
        <BPMSign currentBpm={chartSeq?.bpmChanges[currentBpmIndex]?.bpm} />
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
