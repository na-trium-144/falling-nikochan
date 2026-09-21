import {
  ChartEditing,
  ChartSeqData,
  getSignatureState,
  getStep,
  getTimeSec,
  stepAdd,
  stepCmp,
  stepZero,
  updateBarNum,
} from "@falling-nikochan/chart";
import { RefObject, useEffect, useRef } from "react";
import { YouTubePlayer } from "@/common/youtube.js";
import { SEType } from "@/common/se.js";

export interface UseSETimerParams {
  playing: boolean;
  ytPlayer: RefObject<YouTubePlayer | undefined>;
  playSE: (s: SEType) => void;
  audioLatency?: number | null;
  chart?: ChartEditing;
  chartSeq?: ChartSeqData;
}

export function useSETimer(params: UseSETimerParams) {
  const { playing, ytPlayer, playSE, audioLatency, chart, chartSeq } = params;
  const audioLatencyRef = useRef<number>(0);
  audioLatencyRef.current = audioLatency || 0;

  const currentLevel = chart?.currentLevel;

  // ノートSEタイマー
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const initSETimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      const offset = chart?.offset ?? chartSeq?.offset ?? 0;
      const notes = currentLevel?.seqNotes ?? chartSeq?.notes;

      if (playing && ytPlayer.current && notes) {
        let index = 0;
        const now =
          (ytPlayer.current.getCurrentTime?.() ?? 0) -
          offset +
          audioLatencyRef.current;
        while (index < notes.length && notes[index].hitTimeSec < now) {
          index++;
        }
        const playOne = () => {
          if (ytPlayer.current) {
            const currentOffset = chart?.offset ?? chartSeq?.offset ?? 0;
            const currentNotes =
              chart?.currentLevel?.seqNotes ?? chartSeq?.notes;
            if (!currentNotes) return;

            const now =
              (ytPlayer.current.getCurrentTime?.() ?? 0) -
              currentOffset +
              audioLatencyRef.current;
            timer = null;
            while (
              index < currentNotes.length &&
              currentNotes[index].hitTimeSec <= now
            ) {
              playSE(currentNotes[index].big ? "hitBig" : "hit");
              index++;
            }
            if (index < currentNotes.length) {
              timer = setTimeout(
                playOne,
                (currentNotes[index].hitTimeSec - now) * 1000
              );
            }
          }
        };
        if (index < notes.length) {
          timer = setTimeout(playOne, (notes[index].hitTimeSec - now) * 1000);
        }
      }
    };

    initSETimer();
    chart?.on("change", initSETimer);
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      chart?.off("change", initSETimer);
    };
  }, [playing, ytPlayer, chart, chartSeq, currentLevel, playSE]);

  // メトロノームSEタイマー
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const initSETimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      const offset = chart?.offset ?? chartSeq?.offset ?? 0;
      const bpmChanges =
        currentLevel?.freeze.bpmChanges ?? chartSeq?.bpmChanges;
      const signature = currentLevel
        ? currentLevel.freeze.signature
        : chartSeq
          ? updateBarNum(chartSeq.signature)
          : undefined;

      if (playing && ytPlayer.current && bpmChanges && signature) {
        const now =
          (ytPlayer.current.getCurrentTime?.() ?? 0) -
          offset +
          audioLatencyRef.current;
        let step = getStep(bpmChanges, now, 4);
        const playOne = () => {
          if (ytPlayer.current) {
            const currentOffset = chart?.offset ?? chartSeq?.offset ?? 0;
            const currentBpmChanges =
              chart?.currentLevel?.freeze.bpmChanges ?? chartSeq?.bpmChanges;
            const currentSignature = chart?.currentLevel
              ? chart.currentLevel.freeze.signature
              : chartSeq
                ? updateBarNum(chartSeq.signature)
                : undefined;

            if (!currentBpmChanges || !currentSignature) return;

            const now =
              (ytPlayer.current.getCurrentTime?.() ?? 0) -
              currentOffset +
              audioLatencyRef.current;
            timer = null;
            while (getTimeSec(currentBpmChanges, step) <= now) {
              const ss = getSignatureState(currentSignature, step);
              if (ss.count.numerator === 0 && stepCmp(step, stepZero()) >= 0) {
                playSE(ss.count.fourth === 0 ? "beat1" : "beat");
              }
              step = stepAdd(step, { fourth: 0, numerator: 1, denominator: 4 });
            }
            timer = setTimeout(
              playOne,
              (getTimeSec(currentBpmChanges, step) - now) * 1000
            );
          }
        };
        playOne();
      }
    };

    initSETimer();
    chart?.on("change", initSETimer);
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      chart?.off("change", initSETimer);
    };
  }, [playing, ytPlayer, chart, chartSeq, currentLevel, playSE]);
}
