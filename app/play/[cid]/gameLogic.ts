"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { displayNote, Note } from "@/chartFormat/seq";

export default function useGameLogic(
  getCurrentTimeSec: () => number | undefined,
  auto: boolean
) {
  const [notesAll, setNotesAll] = useState<Note[]>([]);
  const notesYetDone = useRef<Note[]>([]); // まだ判定していないNote

  const [judgeCount, setJudgeCount] = useState<number[]>([0, 0, 0, 0]);
  const notesTotal = notesAll.length;
  const okScore = 0.5;
  const judgeScore = judgeCount[0] * 1 + judgeCount[1] * okScore;
  const [bonus, setBonus] = useState<number>(0); // 1 + 2 + ... + 100 + 100 + ...
  const bonusMax = 100;
  const bonusTotal =
    notesTotal < bonusMax
      ? (notesTotal * (notesTotal + 1)) / 2
      : (bonusMax * (bonusMax + 1)) / 2 + bonusMax * (notesTotal - bonusMax);
  // const score =
  //   ((judgeScore + bonusScore) / (notesTotal + bonusTotal || 1)) * 100;
  const baseScoreRate = 70;
  const chainScoreRate = 30;
  const baseScore = (judgeScore / (notesTotal || 1)) * baseScoreRate;
  const chainScore = (bonus / (bonusTotal || 1)) * chainScoreRate;
  const score = baseScore + chainScore;

  const end = judgeCount.reduce((sum, j) => sum + j, 0) == notesTotal;

  const [chain, setChain] = useState<number>(0);

  const resetNotesAll = useCallback((notes: Note[]) => {
    // note.done などを書き換えるため、元データを壊さないようdeepcopy
    const notesCopy = notes.map((n) => ({ ...n }));
    setNotesAll(notesCopy.slice());
    notesYetDone.current = notesCopy;
    setJudgeCount([0, 0, 0, 0]);
    setChain(0);
    setBonus(0);
  }, []);

  // Noteに判定を保存し、scoreとchainを更新
  const judge = useCallback(
    (n: Note, now: number, j: number) => {
      // j = 1 ~ 4
      if (j <= 3) {
        n.hitPos = displayNote(n, now)?.pos; // 位置を固定
      }
      n.done = j;
      if (j <= 2) {
        const thisChain = chain + 1;
        n.chain = thisChain;
        n.chainBonus =
          1 +
          ((Math.min(thisChain, bonusMax) / bonusTotal) * chainScoreRate) /
            ((1 / notesTotal) * baseScoreRate);
        if (j === 1) {
          setBonus((bonus) => bonus + Math.min(thisChain, bonusMax));
        } else {
          n.chainBonus *= okScore;
          setBonus((bonus) => bonus + Math.min(thisChain, bonusMax) * okScore);
        }
        setChain((chain) => chain + 1);
      } else {
        setChain(0);
      }
      setJudgeCount((judgeCount) => {
        judgeCount = judgeCount.slice();
        judgeCount[j - 1]++;
        return judgeCount;
      });
    },
    [chain, bonusTotal, notesTotal]
  );
  // キーを押したときの判定
  const hit = () => {
    const now = getCurrentTimeSec();
    while (now !== undefined && notesYetDone.current.length >= 1) {
      const n = notesYetDone.current[0];
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= 0.04) {
        console.log(`Good (${late} s)`);
        judge(n, now, 1);
        notesYetDone.current.shift();
        break;
      } else if (Math.abs(late) <= 0.08) {
        console.log(`OK (${late} s)`);
        judge(n, now, 2);
        notesYetDone.current.shift();
        break;
      } else if (late <= 0.12 && late >= -0.25) {
        console.log(`Bad (${late} s)`);
        judge(n, now, 3);
        notesYetDone.current.shift();
        break;
      } else if (late > 0.12) {
        // miss
        console.log("miss in hit()");
        judge(n, now, 4);
        notesYetDone.current.shift();
        continue;
      } else {
        // not yet
        break;
      }
    }
  };
  // 0.1s以上過ぎたものをmiss判定にする
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const removeOneNote = () => {
      timer = null;
      const now = getCurrentTimeSec();
      while (now !== undefined && notesYetDone.current.length >= 1) {
        const n = notesYetDone.current[0];
        const late = now - n.hitTimeSec;
        if (late > 0.12) {
          console.log("miss in interval");
          judge(n, now, 4);
          notesYetDone.current.shift();
          continue;
        } else if (auto && late >= 0) {
          console.log("auto");
          judge(n, now, 1);
          notesYetDone.current.shift();
          continue;
        } else {
          timer = setTimeout(removeOneNote, -Math.ceil(late * 1000));
          break;
        }
      }
    };
    removeOneNote();
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [auto, getCurrentTimeSec, judge]);

  return {
    baseScore,
    chainScore,
    score,
    chain,
    notesAll,
    resetNotesAll,
    hit,
    judgeCount,
    end,
  };
}
