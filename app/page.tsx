"use client"; // あとでけす

import { useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow";
import { loadChart, Note } from "@/chartFormat/seq";
import { Chart, sampleChart } from "@/chartFormat/command";
import FlexYouTube from "./youtube";
import ScoreDisp from "./score";
import RhythmicalSlime from "./rhythmicalSlime";
import { YouTubePlayer } from "./youtubePlayer";
import useGameLogic from "./gameLogic";
import { Key, ReadyMessage, StopMessage } from "./messageBox";
import StatusBox from "./statusBox";

export default function Home() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const ytPlayer = useRef<YouTubePlayer | null>(null);
  const getCurrentTimeSec = useCallback(() => {
    if (ytPlayer.current?.getCurrentTime && chart && playing) {
      return ytPlayer.current?.getCurrentTime() - chart.offset;
    }
  }, [chart, playing]);
  const { score, chain, notesAll, resetNotesAll, hit, judgeCount } =
    useGameLogic(getCurrentTimeSec);

  const [fps, setFps] = useState<number>(0);
  useEffect(() => {
    // テスト用
    const ch = sampleChart();
    setChart(ch);
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, []);

  const [ready, setReady] = useState<boolean>(false);
  const [stopped, setStopped] = useState<boolean>(false);
  const onReady = useCallback(() => {
    console.log("ready");
    setReady(true);
  }, []);
  const onStart = useCallback(() => {
    if (chart && !playing) {
      setPlaying(true);
    }
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, [chart, playing]);
  const onStop = useCallback(() => {
    console.log("stop");
    if (playing) {
      setStopped(true);
      setPlaying(false);
    }
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, [playing]);
  const start = () => {
    if (chart) {
      setStopped(false);
      setReady(false);
      resetNotesAll(loadChart(chart));
      ytPlayer.current?.seekTo(0, true);
      ytPlayer.current?.playVideo();
    }
  };
  const stop = () => {
    ytPlayer.current?.pauseVideo();
  };

  return (
    <main
      className={
        "flex flex-col w-screen h-screen overflow-hidden " +
        "bg-gradient-to-t from-white to-sky-200 "
      }
      tabIndex={0}
      ref={mainRef}
      onKeyDown={(e) => {
        if (e.key === " " && (ready || stopped) && !playing) {
          start();
        } else if (e.key === "Escape" || e.key === "Esc") {
          stop();
        } else {
          hit();
        }
      }}
    >
      <div className="flex-1 w-full flex flex-row-reverse ">
        <div className="grow-0 shrink-0 basis-4/12 flex flex-col items-stretch">
          <div className="grow-0 shrink-0 m-3 p-3 bg-amber-700 rounded-lg">
            <FlexYouTube
              className="block"
              id={chart?.ytId}
              ytPlayer={ytPlayer}
              onReady={onReady}
              onStart={onStart}
              onStop={onStop}
            />
            <p className="font-title text-lg">{chart?.title}</p>
            <p className="font-title text-sm">by {chart?.author}</p>
          </div>
          <div className="flex-1 text-right mr-4">{fps} FPS</div>
          <StatusBox
            className="grow-0 shrink-0 m-3 self-end"
            judgeCount={judgeCount}
            notesTotal={notesAll.length}
          />
          <div className="grow-0 shrink-0 basis-2/12" />
        </div>
        <div className="basis-8/12 relative">
          <FallingWindow
            className="absolute inset-0"
            notes={notesAll}
            getCurrentTimeSec={getCurrentTimeSec}
            playing={playing}
            setFPS={setFps}
          />
          <ScoreDisp
            className="absolute top-0 right-0 "
            score={score}
            best={0}
          />
          {ready && <ReadyMessage />}
          {stopped && <StopMessage />}
        </div>
      </div>
      <div className="relative w-full h-16">
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
          bpmChanges={chart?.bpmChanges}
        />
      </div>
    </main>
  );
}
