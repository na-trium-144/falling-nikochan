"use client";

/**
 * Embedded Play Page for Flutter WebView integration.
 *
 * This page runs the game logic (Judge, timing, scoring) inside the WebView.
 * The WebView is displayed fullscreen with a transparent background so that
 * Flutter's CustomPaint rendering is visible behind it.
 *
 * Input (touch/keyboard) is handled DIRECTLY by the WebView — no round-trip
 * through Flutter, eliminating input latency entirely.
 *
 * URL: /ja/play/embedded?cid=XXXXXX&lvIndex=0
 *
 * Flutter → Web (control commands only, no input):
 *   window.nikochanBridge.start()
 *   window.nikochanBridge.pause()
 *   window.nikochanBridge.resume()
 *   window.nikochanBridge.restart()
 *   window.nikochanBridge.setVolume(volume)
 *
 * Web → Flutter (via flutter_inappwebview):
 *   window.flutter_inappwebview.callHandler('onReady', chartData)
 *   window.flutter_inappwebview.callHandler('onTimeUpdate', timeSec)
 *   window.flutter_inappwebview.callHandler('onJudge', judgeEvent)
 *   window.flutter_inappwebview.callHandler('onFinish', result)
 *   window.flutter_inappwebview.callHandler('onError', message)
 */

import { useCallback, useEffect, useRef, useState } from "react";
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

// Extend window for bridge
declare global {
  interface Window {
    nikochanBridge: NikochanBridge;
    flutter_inappwebview?: {
      callHandler(name: string, ...args: any[]): Promise<any>;
    };
  }
}

interface NikochanBridge {
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

// Helper to send to Flutter
function callFlutter(handlerName: string, data: any) {
  if (window.flutter_inappwebview?.callHandler) {
    window.flutter_inappwebview.callHandler(handlerName, data);
  } else {
    // Debug fallback: log to console when not in Flutter WebView
    console.log(`[Flutter Bridge] ${handlerName}:`, data);
  }
}

export default function EmbeddedPlay() {
  // URL params
  const [cid, setCid] = useState<string>("");
  const [lvIndex, setLvIndex] = useState<number>(0);

  // Chart data
  const [chartSeq, setChartSeq] = useState<ChartSeqData | null>(null);
  const [brief, setBrief] = useState<ChartBrief | null>(null);
  const [ytId, setYtId] = useState<string>("");

  // YouTube
  const ytPlayer = useRef<YouTubePlayer | undefined>(undefined);
  const [ytReady, setYtReady] = useState(false);

  // Game state
  const [chartPlaying, setChartPlaying] = useState(false);
  const judgeRef = useRef<Judge | null>(null);
  const notesRef = useRef<NoteInGame[]>([]);

  // Scoring state
  const scoreState = useRef({
    goodCount: 0,
    okCount: 0,
    badCount: 0,
    missCount: 0,
    combo: 0,
    maxCombo: 0,
    bigCount: 0,
    bigTotal: 0,
    notesTotal: 0,
    bonusTotal: 0,
    judgeScoreSum: 0, // good=1, ok=0.3
    bonusSum: 0,
    notesDone: 0,
  });

  // Time sync state
  const rawStartTimeStamp = useRef<number | null>(null);
  const filteredStartTimeStamp = useRef<number | null>(null);
  const timeStampLastAdjusted = useRef<number>(0);
  const perfStarted = useRef<number | null>(null);
  const sampleTimestamps = useRef<{ perf: number; yt: number }[]>([]);
  const chartPlayingRef = useRef(false);
  const chartSeqRef = useRef<ChartSeqData | null>(null);
  const playbackRate = 1;

  // Animation frame & time update
  const animFrameRef = useRef<number | null>(null);
  const timeUpdateThrottle = useRef<number>(0);

  // Track whether input is enabled (set by Flutter via bridge)
  const inputEnabledRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    chartPlayingRef.current = chartPlaying;
  }, [chartPlaying]);
  useEffect(() => {
    chartSeqRef.current = chartSeq;
  }, [chartSeq]);

  // getCurrentTimeSec - same logic as the main play page
  const getCurrentTimeSec = useCallback((): number | undefined => {
    const seq = chartSeqRef.current;
    if (ytPlayer.current?.getCurrentTime && seq && chartPlayingRef.current) {
      const ytCurrentTime = ytPlayer.current.getCurrentTime();
      const perfNow = performance.now();
      const ytNow = ytCurrentTime - seq.offset;
      rawStartTimeStamp.current = perfNow - (ytNow * 1000) / playbackRate;

      if (filteredStartTimeStamp.current === null) {
        filteredStartTimeStamp.current = rawStartTimeStamp.current;
      }
      if (perfStarted.current === null) {
        perfStarted.current = perfNow;
      }

      const now =
        ((perfNow - filteredStartTimeStamp.current) / 1000) * playbackRate;
      const dt = (perfNow - timeStampLastAdjusted.current) / 1000;

      // Low-pass filter for timestamp smoothing
      filteredStartTimeStamp.current =
        filteredStartTimeStamp.current * Math.exp(-dt / 1.0) +
        rawStartTimeStamp.current * (1 - Math.exp(-dt / 1.0));
      timeStampLastAdjusted.current = perfNow;
      return now;
    }
    return undefined;
  }, []);

  // Calculate score from current state
  const calcScore = useCallback(() => {
    const s = scoreState.current;
    const base =
      s.notesTotal > 0
        ? (s.judgeScoreSum / s.notesTotal) * baseScoreRate
        : 0;
    const chain =
      s.bonusTotal > 0
        ? (s.bonusSum / s.bonusTotal) * chainScoreRate
        : 0;
    const big =
      s.bigTotal > 0
        ? (s.bigCount / s.bigTotal) * bigScoreRate
        : 0;
    return { base, chain, big, total: base + chain + big };
  }, []);

  // Judge callback
  const onJudge = useCallback(
    (
      candidate: HitCandidate,
      now: number,
      bigHit: boolean,
      thisChain: number
    ) => {
      const s = scoreState.current;
      const judgeMap = {
        1: "good",
        2: "ok",
        3: "bad",
        4: "bad",
        5: "miss",
      } as const;
      const judgeName = judgeMap[candidate.judge] || "miss";

      switch (candidate.judge) {
        case 1: // good
          s.goodCount++;
          s.combo++;
          s.judgeScoreSum += 1.0;
          s.bonusSum += Math.min(s.combo, bonusMax);
          break;
        case 2: // ok
          s.okCount++;
          s.combo++;
          s.judgeScoreSum += okBaseScore;
          s.bonusSum += Math.min(s.combo, bonusMax);
          break;
        case 3: // bad
          s.badCount++;
          s.combo = 0;
          break;
        case 4: // bad (late)
          s.badCount++;
          s.combo = 0;
          break;
        case 5: // miss
          s.missCount++;
          s.combo = 0;
          break;
      }
      if (s.combo > s.maxCombo) s.maxCombo = s.combo;
      if (bigHit) s.bigCount++;
      s.notesDone++;

      const score = calcScore();

      const event: JudgeEvent = {
        noteId: candidate.note.id,
        judge: judgeName,
        late: candidate.late,
        isBig: candidate.note.big,
        bigHit,
        targetX: candidate.note.targetX,
        score,
        combo: s.combo,
        maxCombo: s.maxCombo,
        judgeCount: [s.goodCount, s.okCount, s.badCount, s.missCount],
        notesDone: s.notesDone,
      };

      callFlutter("onJudge", event);
    },
    [calcScore]
  );

  // Check for missed notes periodically
  const missCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleMissCheck = useCallback(() => {
    if (missCheckTimer.current) clearTimeout(missCheckTimer.current);
    const check = () => {
      if (!judgeRef.current || !chartPlayingRef.current) return;
      const now = getCurrentTimeSec();
      if (now === undefined) return;
      const nextMiss = judgeRef.current.checkMiss(now);
      if (nextMiss !== null) {
        const delay = Math.max(1, (nextMiss - now) * 1000);
        missCheckTimer.current = setTimeout(check, delay);
      }
    };
    check();
  }, [getCurrentTimeSec]);

  // Check for game end
  const checkGameEnd = useCallback(() => {
    const s = scoreState.current;
    if (s.notesDone >= s.notesTotal && s.notesTotal > 0) {
      const score = calcScore();
      const result: FinishData = {
        score,
        maxCombo: s.maxCombo,
        judgeCount: [s.goodCount, s.okCount, s.badCount, s.missCount],
        bigCount: s.bigCount,
      };
      callFlutter("onFinish", result);
      setChartPlaying(false);
      inputEnabledRef.current = false;
    }
  }, [calcScore]);

  // ============================================================
  // DIRECT INPUT HANDLING
  // Touch/pointer and keyboard events are handled here in the
  // WebView — no round-trip to Flutter needed for input.
  // ============================================================

  // Hit handler — called directly from pointer/keyboard events
  const handleHit = useCallback(() => {
    if (!judgeRef.current || !chartPlayingRef.current) return;
    if (!inputEnabledRef.current) return;
    const now = getCurrentTimeSec();
    if (now === undefined) return;

    judgeRef.current.hit(now);
    // onJudge callback fires automatically via Judge if a note is hit
    judgeRef.current.checkMiss(now);
    checkGameEnd();
  }, [getCurrentTimeSec, checkGameEnd]);

  // Pointer events (touch/mouse/pen)
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!inputEnabledRef.current) return;
      e.preventDefault();
      handleHit();
    };

    // Prevent context menu during gameplay
    const onContextMenu = (e: Event) => {
      if (inputEnabledRef.current) {
        e.preventDefault();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, {
      passive: false,
    });
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [handleHit]);

  // Keyboard events
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!inputEnabledRef.current) return;

      // Any key (except modifiers/Escape/Space) triggers a hit during gameplay
      if (
        e.key === "Escape" ||
        e.key === "Meta" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Shift"
      ) {
        return; // Let Flutter handle these via bridge
      }

      e.preventDefault();
      handleHit();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [handleHit]);

  // Animation loop: send time updates to Flutter
  useEffect(() => {
    const loop = () => {
      animFrameRef.current = requestAnimationFrame(loop);
      if (!chartPlayingRef.current) return;

      const now = getCurrentTimeSec();
      if (now === undefined) return;

      // Send time update (throttled to ~60fps)
      const perfNow = performance.now();
      if (perfNow - timeUpdateThrottle.current > 16) {
        timeUpdateThrottle.current = perfNow;
        callFlutter("onTimeUpdate", now);
      }

      // Check for game end via ytEndSec
      const seq = chartSeqRef.current;
      if (seq && seq.ytEndSec > 0 && now + seq.offset >= seq.ytEndSec) {
        // Mark remaining notes as miss
        if (judgeRef.current) {
          judgeRef.current.checkMiss(now + 10); // force all remaining
        }
        checkGameEnd();
      }
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [getCurrentTimeSec, checkGameEnd]);

  // Fetch chart data on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cidParam = params.get("cid") || "";
    const lvParam = parseInt(params.get("lvIndex") || "0", 10);
    setCid(cidParam);
    setLvIndex(lvParam);

    if (!cidParam) {
      callFlutter("onError", "Missing cid parameter");
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
        callFlutter("onError", String(err));
      });
  }, []);

  // When chart data + YouTube are both ready, send onReady to Flutter
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

      callFlutter("onReady", readyData);
    }
  }, [chartSeq, ytReady, brief]);

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
        onFlash: () => {}, // Flash handled by Flutter
      };

      judgeRef.current = new Judge(notes, judgeOpts, now);
    },
    [chartSeq, onJudge]
  );

  // Set up the bridge on window (Flutter → Web control commands)
  useEffect(() => {
    window.nikochanBridge = {
      start() {
        if (!chartSeq) return;
        const ytBegin = (chartSeq as any).ytBegin ?? 0;
        ytPlayer.current?.seekTo?.(ytBegin, true);
        ytPlayer.current?.playVideo?.();

        // Reset time sync
        rawStartTimeStamp.current = null;
        filteredStartTimeStamp.current = null;
        perfStarted.current = null;
        sampleTimestamps.current = [];
        timeStampLastAdjusted.current = performance.now();

        setChartPlaying(true);

        // Initialize judge with current time
        setTimeout(() => {
          const now = getCurrentTimeSec();
          initJudge(now ?? -Infinity);
          scheduleMissCheck();
          // Enable direct input handling
          inputEnabledRef.current = true;
        }, 100);
      },

      pause() {
        ytPlayer.current?.pauseVideo?.();
        setChartPlaying(false);
        inputEnabledRef.current = false;
        if (missCheckTimer.current) clearTimeout(missCheckTimer.current);
      },

      resume() {
        ytPlayer.current?.playVideo?.();
        setChartPlaying(true);
        inputEnabledRef.current = true;
        scheduleMissCheck();
      },

      restart() {
        if (!chartSeq) return;
        const ytBegin = (chartSeq as any).ytBegin ?? 0;
        ytPlayer.current?.seekTo?.(ytBegin, true);
        ytPlayer.current?.pauseVideo?.();
        setChartPlaying(false);
        inputEnabledRef.current = false;
        if (missCheckTimer.current) clearTimeout(missCheckTimer.current);

        // Reset time sync
        rawStartTimeStamp.current = null;
        filteredStartTimeStamp.current = null;
        perfStarted.current = null;
        sampleTimestamps.current = [];
      },

      setVolume(volume: number) {
        ytPlayer.current?.setVolume?.(volume);
      },
    };
  }, [
    chartSeq,
    getCurrentTimeSec,
    initJudge,
    scheduleMissCheck,
    checkGameEnd,
  ]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        // Transparent background so Flutter's CustomPaint shows through
        backgroundColor: "transparent",
        overflow: "hidden",
        position: "relative",
        // Ensure touch events are captured
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* YouTube player - small, positioned in corner, nearly invisible
          but must have real dimensions for YouTube to function */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 320,
          height: 180,
          zIndex: 1,
          opacity: 0.01, // Nearly invisible but functional
          pointerEvents: "none", // Don't intercept game input
        }}
      >
        <FlexYouTube
          id={ytId}
          control={false}
          ytPlayer={ytPlayer}
          onReady={() => setYtReady(true)}
          onStart={() => {
            // YouTube started playing
          }}
          onStop={() => {
            // YouTube stopped
          }}
          fixedSide="width"
        />
      </div>

      {/* Debug info (only visible in standalone browser, hidden in Flutter) */}
      {!window.flutter_inappwebview && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            color: "#666",
            fontSize: 12,
            fontFamily: "monospace",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div>
            Embedded Mode | CID: {cid} | Lv: {lvIndex}
          </div>
          <div>
            YT Ready: {String(ytReady)} | Chart:{" "}
            {chartSeq ? "loaded" : "loading"}
          </div>
          <div>Playing: {String(chartPlaying)}</div>
        </div>
      )}
    </div>
  );
}
