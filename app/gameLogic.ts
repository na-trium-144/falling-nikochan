"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Note } from "@/chartFormat/seq";

export default function useGameLogic(
  getCurrentTimeSec: () => number | undefined
) {
  const [notesAll, setNotesAll] = useState<Note[]>([]);
  const notesYetDone = useRef<Note[]>([]); // まだ判定していないNote

  const [judgeCount, setJudgeCount] = useState<number[]>([0, 0, 0, 0]);
  const notesTotal = notesAll.length;
  const judgeScore = judgeCount[0] * 1 + judgeCount[1] * 0.5;
  const [bonus, setBonus] = useState<number>(0); // 1 + 2 + ... + 100 + 100 + ...
  const bonusMax = 100;
  const bonusScore = (bonus / bonusMax) * 0.5;
  const bonusTotal =
    ((notesTotal < 100
      ? (notesTotal * (notesTotal + 1)) / 2
      : (100 * 101) / 2 + 100 * (notesTotal - 100)) /
      bonusMax) *
    0.5;
  const score =
    ((judgeScore + bonusScore) / (notesTotal + bonusTotal || 1)) * 100;

  const [chain, setChain] = useState<number>(0);

  const resetNotesAll = useCallback((notes: Note[]) => {
    setNotesAll(notes);
    setJudgeCount([0, 0, 0, 0]);
    setChain(0);
    setBonus(0);

    notesYetDone.current = notes.slice();
  }, []);

  // Noteに判定を保存し、scoreとchainを更新
  const judge = useCallback(
    (n: Note, now: number, j: number) => {
      // j = 1 ~ 4
      if (j <= 3) {
        n.hitPos = n.display(now, n)?.pos; // 位置を固定
      }
      n.done = j;
      if (j <= 2) {
        const thisChain = chain + 1;
        n.chain = thisChain;
        setBonus((bonus) => bonus + thisChain);
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
    [chain]
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
      } else if (late <= 0.1 && late >= -0.25) {
        console.log(`Bad (${late} s)`);
        judge(n, now, 3);
        notesYetDone.current.shift();
        break;
      } else if (late > 0.1) {
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
        if (late > 0.1) {
          console.log("miss in interval");
          judge(n, now, 4);
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
  }, [getCurrentTimeSec, judge]);

  return { score, chain, notesAll, resetNotesAll, hit, judgeCount };
}
