"use client";

/**
 * Embedded Play Page for WebView/IFrame integration.
 *
 * This page runs the game logic (Judge, timing, scoring) inside the WebView or IFrame.
 *
 * Input (touch/keyboard) is handled but nothing will be displayed in this page.
 *
 * URL: /embed-play
 *   Query patameters:
 *     ?background=00FFFF  set background color (without # )
 *
 * Host → Web (control commands only, no input):
 *   window.nikochanEmbed.init(cid, lvIndex)
 *   window.nikochanEmbed.start()
 *   window.nikochanEmbed.pause()
 *   window.nikochanEmbed.resume()
 *   window.nikochanEmbed.restart()
 *   window.nikochanEmbed.setVolume(volume)
 *
 * Web → Host (via flutter_inappwebview / postMessage):
 *   onLoaded
 *   onReady
 *   onStart
 *   onStop
 *   onTimeUpdate
 *   onJudge
 *   onFinish
 *   onError
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import {
  ChartSeqData,
  Judge,
  JudgeOptions,
  HitCandidate,
  NoteInGame,
  okBaseScore,
  bonusMax,
  baseScoreRate,
  chainScoreRate,
  bigScoreRate,
  ChartBrief,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { useYouTubeSync } from "@/play/youtubeSync";

// Extend window for bridge
declare global {
  interface Window {
    nikochanEmbed: NikochanEmbed;
    flutter_inappwebview?: {
      callHandler(name: string, ...args: any[]): Promise<any>;
    };
  }
}

interface NikochanEmbed {
  init(cid: string, lvIndex: number): void;
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  setVolume(volume: number): void;
}

interface JudgeEvent {
  noteId: number;
  judge: "good" | "ok" | "bad" | "miss";
  late: number;
  isBig: boolean;
  bigHit: boolean;
  targetX: number;
  score: {
    base: number;
    chain: number;
    big: number;
    total: number;
  };
  combo: number;
  maxCombo: number;
  judgeCount: [number, number, number, number]; // good, ok, bad, miss
  notesDone: number;
}

interface ReadyData {
  notes: Array<{
    id: number;
    big: boolean;
    hitTimeSec: number;
    appearTimeSec: number;
    targetX: number;
    vx: number;
    vy: number;
    ay: number;
    uRange: [number, number] | null;
    display: Array<{
      timeSecBefore: number;
      u0: number;
      du: number;
      ddu: number;
    }>;
  }>;
  bpmChanges: Array<{ timeSec: number; bpm: number }>;
  speedChanges: Array<{ timeSec: number; bpm: number; interp: boolean }>;
  offset: number;
  ytId: string;
  ytBegin: number;
  ytEndSec: number;
  notesTotal: number;
  bigTotal: number;
}

interface FinishData {
  score: {
    base: number;
    chain: number;
    big: number;
    total: number;
  };
  maxCombo: number;
  judgeCount: [number, number, number, number]; // good, ok, bad, miss
  bigCount: number;
}

// Helper to send to Host (supports both native flutter_inappwebview and Web postMessage)
function notifyHost(handlerName: string, data: any) {
  // Native WebView bridge
  if (
    typeof window !== "undefined" &&
    window.flutter_inappwebview?.callHandler
  ) {
    window.flutter_inappwebview.callHandler(handlerName, data);
  }

  // Web environment: postMessage to parent window (Host iframe)
  if (typeof window !== "undefined") {
    const payload = {
      type: "nikochanEmbed",
      handler: handlerName,
      data: data,
    };
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, "*");
    }
    window.postMessage(payload, "*");
  }

  console.log(`[Embed Bridge] ${handlerName}:`, data);
}

export default function EmbeddedPlay() {
  useLayoutEffect(() => {
    const bgColor = new URLSearchParams(location.search).get("background");
    if (bgColor) {
      document.body.style.background = "#" + bgColor;
    }
  }, []);

  // Chart data
  const [chartSeq, setChartSeq] = useState<ChartSeqData | null>(null);
  const [brief, setBrief] = useState<ChartBrief | null>(null);
  const [ytId, setYtId] = useState<string>("");

  const userOffset = 0;

  const ytPlayer = useRef<YouTubePlayer>(undefined);
  const [ytVolume, setYtVolume_] = useState<number>(100);
  const setYtVolume = useCallback((v: number) => {
    setYtVolume_(v);
    ytPlayer.current?.setVolume?.(v);
  }, []);

  const ytBegin = chartSeq?.ytBegin ?? 0;
  const ytEnd = chartSeq?.ytEndSec ?? 0;

  const offsetPlusLatency = userOffset;

  const {
    // playState,
    chartPlaying,
    showStopped,
    showResult,
    userBegin,
    setUserBegin,
    playbackRate,
    setPlaybackRate,
    changePlaybackRate,
    minActualPlaybackRate,
    rawStartTimeStamp,
    filteredStartTimeStamp,
    getCurrentTimeSec,
    start: ytStart,
    stop: ytStop,
    finish: ytFinish,
    ytReady,
    ytError,
    ytPlayerFinished,
    endSecPassed,
    onStart: ytOnStart,
    onStop: ytOnStop,
    onReady: ytOnReady,
    onError: ytOnError,
  } = useYouTubeSync(
    ytPlayer,
    ytBegin,
    ytEnd,
    chartSeq?.offset ?? 0,
    offsetPlusLatency,
    ytVolume,
    {
      onStart() {
        if (chartSeq) {
          const now =
            (ytPlayer.current?.getCurrentTime?.() ?? -Infinity) -
            chartSeq.offset -
            offsetPlusLatency * playbackRate;
          initJudge(now);
          document.body.focus();
          notifyHost("onStart", null);
        }
      },
      onStop() {
        notifyHost("onStop", null);
        document.body.focus();
      },
      onFinish() {
        const s = scoreState.current;
        const base = (s.judgeScoreSum / (s.notesTotal || 1)) * baseScoreRate;
        const chain = (s.bonusSum / (s.bonusTotal || 1)) * chainScoreRate;
        const big = (s.bigCount / (s.bigTotal || 1)) * bigScoreRate;
        const result: FinishData = {
          score: { base, big, chain, total: base + chain + big },
          maxCombo: s.maxCombo,
          judgeCount: [s.goodCount, s.okCount, s.badCount, s.missCount],
          bigCount: s.bigCount,
        };
        notifyHost("onFinish", result);
      },
    }
  );

  // not using useGameLogic()

  const judgeRef = useRef<Judge | null>(null);
  const notesRef = useRef<NoteInGame[]>([]);
  const scoreState = useRef({
    goodCount: 0,
    okCount: 0,
    badCount: 0,
    missCount: 0,
    combo: 0,
    maxCombo: 0,
    bigCount: 0,
    bigMiss: 0,
    bigTotal: 0,
    notesTotal: 0,
    bonusTotal: 0,
    judgeScoreSum: 0, // good=1, ok=0.3
    bonusSum: 0,
    notesDone: 0,
  });
  const animFrameRef = useRef<number | null>(null);
  const timeUpdateThrottle = useRef<number>(0);
  const onJudge = useCallback(
    (
      candidate: HitCandidate,
      _now: number,
      bigHit: boolean,
      thisChain: number
    ) => {
      const s = scoreState.current;
      const judgeMap = {
        1: "good",
        2: "ok",
        3: "bad",
        4: "miss",
        5: "miss",
      } as const;
      const judgeName = judgeMap[candidate.judge] || "miss";

      if (bigHit) {
        if (candidate.judge <= 2) {
          s.bigCount++;
        } else {
          s.bigMiss++;
        }
      } else {
        s.combo = thisChain;
        s.notesDone++;
        switch (candidate.judge) {
          case 1:
            s.goodCount++;
            s.judgeScoreSum += 1.0;
            s.bonusSum += Math.min(s.combo, bonusMax);
            break;
          case 2:
            s.okCount++;
            s.judgeScoreSum += okBaseScore;
            s.bonusSum += Math.min(s.combo, bonusMax);
            break;
          case 3:
            s.badCount++;
            break;
          case 4:
          case 5:
            s.missCount++;
            break;
        }
      }

      const base = (s.judgeScoreSum / (s.notesTotal || 1)) * baseScoreRate;
      const chain = (s.bonusSum / (s.bonusTotal || 1)) * chainScoreRate;
      const big = (s.bigCount / (s.bigTotal || 1)) * bigScoreRate;

      const event: JudgeEvent = {
        noteId: candidate.note.id,
        judge: judgeName,
        late: candidate.late,
        isBig: candidate.note.big,
        bigHit,
        targetX: candidate.note.targetX,
        score: { base, chain, big, total: base + chain + big },
        combo: s.combo,
        maxCombo: s.maxCombo,
        judgeCount: [s.goodCount, s.okCount, s.badCount, s.missCount],
        notesDone: s.notesDone,
      };

      notifyHost("onJudge", event);
    },
    []
  );

  // badLateSec以上過ぎたものをmiss判定にする
  useEffect(() => {
    // if (auto) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const removeOneNote = () => {
      timer = null;
      const now = getCurrentTimeSec();
      if (now !== undefined && judgeRef.current) {
        const nextMissTime = judgeRef.current.checkMiss(now);
        if (nextMissTime !== null) {
          timer = setTimeout(
            removeOneNote,
            (nextMissTime * 1000) / playbackRate
          );
        }
      }
    };
    removeOneNote();
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [getCurrentTimeSec, playbackRate]);

  // Check for game end
  const checkChartEnd = useCallback(() => {
    const s = scoreState.current;
    const judgeCount = [s.goodCount, s.okCount, s.badCount, s.missCount];
    return (
      judgeCount.reduce((sum, j) => sum + j, 0) == s.notesTotal &&
      s.bigCount + s.bigMiss == s.bigTotal
    );
  }, []);

  // Initialize Judge when chart is ready
  const initJudge = useCallback(
    (now: number) => {
      if (!chartSeq) return;

      // Reset scoring state
      scoreState.current = {
        goodCount: 0,
        okCount: 0,
        badCount: 0,
        missCount: 0,
        combo: 0,
        maxCombo: 0,
        bigCount: 0,
        bigMiss: 0,
        bigTotal: chartSeq.notes.filter((n: any) => n.big).length,
        notesTotal: chartSeq.notes.length,
        bonusTotal:
          chartSeq.notes.length < bonusMax
            ? (chartSeq.notes.length * (chartSeq.notes.length + 1)) / 2
            : (bonusMax * (bonusMax + 1)) / 2 +
              bonusMax * (chartSeq.notes.length - bonusMax),
        judgeScoreSum: 0,
        bonusSum: 0,
        notesDone: 0,
      };

      // Create notes for game
      const notes: NoteInGame[] = chartSeq.notes.map((n: any) => ({
        ...n,
        done: 0,
        bigDone: false,
      }));
      notesRef.current = notes;

      const judgeOpts: JudgeOptions = {
        judgeForAuto: false,
        playbackRate: playbackRate,
        onJudge,
        onPlaySE: () => {}, // SE not needed in embedded mode
        onFlash: () => {}, // Flash handled by host
      };

      judgeRef.current = new Judge(notes, judgeOpts, now);
    },
    [chartSeq, onJudge]
  );

  useEffect(() => {
    document.body.focus();
  }, []);

  useEffect(() => {
    const disableMenu = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", disableMenu);
    return () => document.removeEventListener("contextmenu", disableMenu);
  }, []);

  useEffect(() => {
    const hit = () => {
      const now = getCurrentTimeSec();
      if (now !== undefined && judgeRef.current) {
        const { candidate } = judgeRef.current.hit(now);
        if (candidate) {
          // flash({ targetX: candidate.note.targetX });
        } else {
          // flash({ targetX: 0.5 });
        }
      }
    };
    const keydown = (e: KeyboardEvent) => {
      if (e.repeat) {
        return;
      }
      hit();
    };
    window.addEventListener("keydown", keydown);
    document.body.addEventListener("pointerdown", hit);
    return () => {
      window.removeEventListener("keydown", keydown);
      document.body.removeEventListener("pointerdown", hit);
    };
  }, [getCurrentTimeSec]);

  // Animation loop: send time updates to Flutter
  useEffect(() => {
    let chartEndedAt: number | null = null;
    const loop = () => {
      animFrameRef.current = requestAnimationFrame(loop);
      if (!chartPlaying) {
        chartEndedAt = null;
        return;
      }

      const now = getCurrentTimeSec();
      if (now === undefined) {
        chartEndedAt = null;
        return;
      }

      // Send time update (throttled to ~60fps)
      const perfNow = performance.now();
      if (perfNow - timeUpdateThrottle.current > 16) {
        timeUpdateThrottle.current = perfNow;
        notifyHost("onTimeUpdate", now);
      }

      if (checkChartEnd() && endSecPassed && chartEndedAt === null) {
        chartEndedAt = now;
      }
      if (chartEndedAt !== null && now - chartEndedAt > 1) {
        ytFinish();
      }
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [getCurrentTimeSec, chartPlaying, checkChartEnd, endSecPassed, ytFinish]);

  // Initialize chart data via method call
  const initChart = useCallback((cidParam: string, lvParam: number) => {
    if (!cidParam) {
      notifyHost("onError", "Missing cid parameter");
      return;
    }

    // Fetch brief
    fetch(`https://nikochan.utcode.net/api/brief/${cidParam}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Brief fetch failed: ${res.status}`);
        return res.json();
      })
      .then((briefData: ChartBrief) => {
        setBrief(briefData);
        setYtId(briefData.ytId);

        // Fetch seqFile
        return fetch(
          `https://nikochan.utcode.net/api/seqFile/${cidParam}/${lvParam}`
        );
      })
      .then((res) => {
        if (!res.ok) throw new Error(`SeqFile fetch failed: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        const decoded = msgpack.decode(new Uint8Array(buf)) as ChartSeqData;
        setChartSeq(decoded);
      })
      .catch((err) => {
        notifyHost("onError", String(err));
      });
  }, []);

  // When chart data + YouTube are both ready, send onReady to Host
  useEffect(() => {
    if (chartSeq && ytReady && brief) {
      const readyData: ReadyData = {
        notes: chartSeq.notes.map((n: any) => ({
          id: n.id,
          big: n.big,
          hitTimeSec: n.hitTimeSec,
          appearTimeSec: n.appearTimeSec,
          targetX: n.targetX,
          vx: n.vx,
          vy: n.vy,
          ay: n.ay,
          uRange: n.uRange || null,
          display: (n.display || []).map((d: any) => ({
            timeSecBefore: d.timeSecBefore,
            u0: d.u0,
            du: d.du,
            ddu: d.ddu,
          })),
        })),
        bpmChanges: (chartSeq.bpmChanges || []).map((b: any) => ({
          timeSec: b.timeSec,
          bpm: b.bpm,
        })),
        speedChanges: (chartSeq.speedChanges || []).map((s: any) => ({
          timeSec: s.timeSec,
          bpm: s.bpm,
          interp: s.interp,
        })),
        offset: chartSeq.offset,
        ytId: brief.ytId,
        ytBegin: (chartSeq as any).ytBegin ?? 0,
        ytEndSec: (chartSeq as any).ytEndSec ?? 0,
        notesTotal: chartSeq.notes.length,
        bigTotal: chartSeq.notes.filter((n: any) => n.big).length,
      };

      notifyHost("onReady", readyData);
    }
  }, [chartSeq, ytReady, brief]);

  // Set up the bridge on window (Host → Web control commands)
  useEffect(() => {
    window.nikochanEmbed = {
      init(cid: string, lvIndex: number) {
        initChart(cid, lvIndex);
      },
      start: ytStart,
      pause: ytStop,
      resume: ytStart,
      restart: ytStart,
      setVolume: setYtVolume,
    };

    notifyHost("onLoaded", null);
  }, [initChart, ytStart, ytStop, setYtVolume]);

  // Listen for control commands from parent window (Host iframe via postMessage)
  useEffect(() => {
    const handleCommandMessage = (event: MessageEvent) => {
      let msg = event.data;
      if (typeof msg === "string") {
        try {
          msg = JSON.parse(msg);
        } catch {
          // Ignore invalid JSON
        }
      }
      if (
        msg &&
        typeof msg === "object" &&
        msg.type === "nikochanEmbed" &&
        msg.action
      ) {
        const action = msg.action;
        const args = msg.args || [];
        const embed = window.nikochanEmbed;
        if (!embed) {
          if (action === "init") {
            (window as any)._pendingInit = [args[0], Number(args[1] ?? 0)];
          }
          return;
        }

        if (action === "init") embed.init(args[0], Number(args[1] ?? 0));
        else if (action === "start") embed.start();
        else if (action === "pause") embed.pause();
        else if (action === "resume") embed.resume();
        else if (action === "restart") embed.restart();
        else if (action === "setVolume") embed.setVolume(args[0]);
      }
    };

    window.addEventListener("message", handleCommandMessage);
    return () => {
      window.removeEventListener("message", handleCommandMessage);
    };
  }, []);

  return (
    <div className="absolute top-0 right-0 w-[30vw] z-1">
      <FlexYouTube
        id={ytId}
        control={false}
        ytPlayer={ytPlayer}
        onReady={ytOnReady}
        onStart={ytOnStart}
        onStop={ytOnStop}
        onError={ytOnError}
        fixedSide="width"
      />
    </div>
  );
}
