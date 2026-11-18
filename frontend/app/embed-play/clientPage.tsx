"use client";

/**
 * Embedded Play Page for WebView/IFrame integration.
 *
 * This page runs the game logic (Judge, timing, scoring) inside the WebView or IFrame.
 *
 * Input (touch/keyboard) is handled but nothing will be displayed in this page.
 *
 * URL: /embed-play
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
  if (typeof window !== "undefined" && window.flutter_inappwebview?.callHandler) {
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
      _now: number,
      bigHit: boolean,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _thisChain: number
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

      notifyHost("onJudge", event);
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
      notifyHost("onFinish", result);
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
        notifyHost("onTimeUpdate", now);
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
        onFlash: () => {}, // Flash handled by host
      };

      judgeRef.current = new Judge(notes, judgeOpts, now);
    },
    [chartSeq, onJudge]
  );

  // Set up the bridge on window (Host → Web control commands)
  useEffect(() => {
    window.nikochanEmbed = {
      init(cid: string, lvIndex: number) {
        initChart(cid, lvIndex);
      },

      start() {
        const seq = chartSeqRef.current;
        if (!seq) return;
        judgeRef.current = null;
        const ytBegin = (seq as any).ytBegin ?? 0;
        ytPlayer.current?.seekTo?.(ytBegin, true);
        ytPlayer.current?.playVideo?.();
      },

      pause() {
        ytPlayer.current?.pauseVideo?.();
      },

      resume() {
        ytPlayer.current?.playVideo?.();
      },

      restart() {
        const seq = chartSeqRef.current;
        if (!seq) return;
        judgeRef.current = null;
        const ytBegin = (seq as any).ytBegin ?? 0;
        ytPlayer.current?.seekTo?.(ytBegin, true);
        ytPlayer.current?.pauseVideo?.();
      },

      setVolume(volume: number) {
        ytPlayer.current?.setVolume?.(volume);
      },
    };

    if ((window as any)._pendingInit) {
      const [pCid, pLv] = (window as any)._pendingInit;
      delete (window as any)._pendingInit;
      initChart(pCid, pLv);
    }

    notifyHost("onLoaded", null);
  }, [initChart]);

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
        onReady={() => setYtReady(true)}
        onStart={() => {
          // YouTube started playing
          rawStartTimeStamp.current = null;
          filteredStartTimeStamp.current = null;
          perfStarted.current = null;
          sampleTimestamps.current = [];
          timeStampLastAdjusted.current = performance.now();

          setChartPlaying(true);

          const now = getCurrentTimeSec();
          if (!judgeRef.current) {
            initJudge(now ?? -Infinity);
          }
          scheduleMissCheck();
          inputEnabledRef.current = true;

          notifyHost("onStart", null);
        }}
        onStop={() => {
          // YouTube stopped
          setChartPlaying(false);
          inputEnabledRef.current = false;
          if (missCheckTimer.current) clearTimeout(missCheckTimer.current);

          notifyHost("onStop", null);
        }}
        fixedSide="width"
      />
    </div>
  );
}
