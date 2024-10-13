"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { displayNote, Note } from "@/chartFormat/seq";
import {
  goodSec,
  okSec,
  badFastSec,
  badLateSec,
  okBaseScore,
  bonusMax,
  baseScoreRate,
  chainScoreRate,
  bigScoreRate,
} from "@/common/gameConstant";

export default function useGameLogic(
  getCurrentTimeSec: () => number | undefined,
  auto: boolean
) {
  const [notesAll, setNotesAll] = useState<Note[]>([]);
  const notesYetDone = useRef<Note[]>([]); // まだ判定していないNote
  const notesBigYetDone = useRef<Note[]>([]); // 通常判定がおわってbig判定がまだのNote

  // good, ok, bad, missの個数
  const [judgeCount, setJudgeCount] = useState<
    [number, number, number, number]
  >([0, 0, 0, 0]);
  const notesTotal = notesAll.length;
  const judgeScore = judgeCount[0] * 1 + judgeCount[1] * okBaseScore;
  const [bonus, setBonus] = useState<number>(0); // 1 + 2 + ... + 100 + 100 + ...
  const bonusTotal =
    notesTotal < bonusMax
      ? (notesTotal * (notesTotal + 1)) / 2
      : (bonusMax * (bonusMax + 1)) / 2 + bonusMax * (notesTotal - bonusMax);
  const [bigCount, setBigCount] = useState<number>(0);
  const [bigTotal, setBigTotal] = useState<number>(0);
  const baseScore = (judgeScore / (notesTotal || 1)) * baseScoreRate;
  const chainScore = (bonus / (bonusTotal || 1)) * chainScoreRate;
  const bigScore = (bigCount / (bigTotal || 1)) * bigScoreRate;
  const score = baseScore + chainScore + bigScore;

  const end = judgeCount.reduce((sum, j) => sum + j, 0) == notesTotal;

  const [chain, setChain] = useState<number>(0);

  const resetNotesAll = useCallback((notes: Note[]) => {
    // note.done などを書き換えるため、元データを壊さないようdeepcopy
    const notesCopy = notes.map((n) => ({ ...n }));
    setNotesAll(notesCopy.slice());
    notesYetDone.current = notesCopy;
    notesBigYetDone.current = [];
    setJudgeCount([0, 0, 0, 0]);
    setChain(0);
    setBonus(0);
    setBigCount(0);
    setBigTotal(notesCopy.filter((n) => n.big).length);
  }, []);

  // Noteに判定を保存し、scoreとchainを更新
  const judge = useCallback(
    (n: Note, now: number, j: number) => {
      if (n.big && n.done > 0) {
        n.bigDone = true;
        if (j <= 2) {
          setBigCount((big) => big + 1);
          if (n.chainBonus !== undefined) {
            n.chainBonus +=
              ((1 / (bigTotal || 1)) * bigScoreRate) /
              ((1 / notesTotal) * baseScoreRate);
          }
        }
      } else {
        // j = 1 ~ 4
        if (j <= 3) {
          n.hitPos = displayNote(n, now)?.pos; // 位置を固定
        }
        n.done = j;
        if (j <= 2) {
          const thisChain = chain + 1;
          n.chain = thisChain;
          n.chainBonus =
            ((Math.min(thisChain, bonusMax) / bonusTotal) * chainScoreRate) /
            ((1 / notesTotal) * baseScoreRate);
          setBonus((bonus) => bonus + Math.min(thisChain, bonusMax));
          if (j === 1) {
            n.chainBonus += 1;
          } else {
            n.chainBonus += okBaseScore;
          }
          setChain((chain) => chain + 1);
        } else {
          setChain(0);
        }
        setJudgeCount((judgeCount) => {
          judgeCount = judgeCount.slice() as [number, number, number, number];
          judgeCount[j - 1]++;
          return judgeCount;
        });
      }
    },
    [chain, bonusTotal, notesTotal, bigTotal]
  );

  // キーを押したときの判定
  const hit = () => {
    const now = getCurrentTimeSec();
    let candidate: Note | null = null;
    let candidateJudge: number = 0;
    while (now !== undefined && notesYetDone.current.length >= 1) {
      const n = notesYetDone.current[0];
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec) {
        console.log(`Good (${late} s)`);
        candidate = n;
        candidateJudge = 1;
        break;
      } else if (Math.abs(late) <= okSec) {
        console.log(`OK (${late} s)`);
        candidate = n;
        candidateJudge = 2;
        break;
      } else if (late <= badLateSec && late >= badFastSec) {
        console.log(`Bad (${late} s)`);
        candidate = n;
        candidateJudge = 3;
        break;
      } else if (late > badLateSec) {
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
    let candidateBig: Note | null = null;
    let candidateJudgeBig: number = 0;
    while (now !== undefined && notesBigYetDone.current.length >= 1) {
      const n = notesBigYetDone.current[0];
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec) {
        console.log(`Big Good (${late} s)`);
        candidateBig = n;
        candidateJudgeBig = 1;
        break;
      } else if (Math.abs(late) <= okSec) {
        console.log(`Big OK (${late} s)`);
        candidateBig = n;
        candidateJudgeBig = 2;
        break;
      } else if (late <= badLateSec && late >= badFastSec) {
        console.log(`Big Bad (${late} s)`);
        candidateBig = n;
        candidateJudgeBig = 3;
        break;
      } else if (late > badLateSec) {
        // miss
        console.log("Big miss in hit()");
        judge(n, now, 4);
        notesBigYetDone.current.shift();
        continue;
      } else {
        // not yet
        break;
      }
    }
    // candidateJudgeとcandidateJudgeBigのうち近い方を判定する
    if (
      now &&
      candidate !== null &&
      (candidateBig === null || candidateJudge <= candidateJudgeBig)
    ) {
      judge(candidate, now, candidateJudge);
      notesYetDone.current.shift();
      if (candidate.big) {
        notesBigYetDone.current.push(candidate);
      }
    } else if (now && candidateBig !== null) {
      judge(candidateBig, now, candidateJudgeBig);
      notesBigYetDone.current.shift();
    }
  };
  // 0.1s以上過ぎたものをmiss判定にする
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const removeOneNote = () => {
      timer = null;
      const now = getCurrentTimeSec();
      let nextMissTime: number | null = null;
      while (now !== undefined && notesYetDone.current.length >= 1) {
        const n = notesYetDone.current[0];
        const late = now - n.hitTimeSec;
        if (late > badLateSec) {
          console.log("miss in interval");
          judge(n, now, 4);
          notesYetDone.current.shift();
          continue;
        } else if (auto && late >= 0) {
          console.log("auto");
          judge(n, now, 1);
          notesYetDone.current.shift();
          if (n.big) {
            notesBigYetDone.current.push(n);
          }
          continue;
        } else {
          nextMissTime = late;
          break;
        }
      }
      while (now !== undefined && notesBigYetDone.current.length >= 1) {
        const n = notesBigYetDone.current[0];
        const late = now - n.hitTimeSec;
        if (late > badLateSec) {
          console.log("Big miss in interval");
          judge(n, now, 4);
          notesBigYetDone.current.shift();
          continue;
        } else if (auto && late >= 0) {
          console.log("auto");
          judge(n, now, 1);
          notesBigYetDone.current.shift();
          continue;
        } else {
          nextMissTime =
            nextMissTime !== null && nextMissTime < late ? nextMissTime : late;
          break;
        }
      }
      if (nextMissTime !== null) {
        timer = setTimeout(removeOneNote, -Math.ceil(nextMissTime * 1000));
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
  };
}
