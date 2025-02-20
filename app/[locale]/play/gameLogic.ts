"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
} from "@/../../chartFormat/gameConstant.js";
import { displayNote6, Note6 } from "@/../../chartFormat/legacy/seq6.js";
import { displayNote7, Note7 } from "@/../../chartFormat/legacy/seq7.js";

export default function useGameLogic(
  getCurrentTimeSec: () => number | undefined,
  auto: boolean,
  userOffset: number,
) {
  const [notesAll, setNotesAll] = useState<Note6[] | Note7[]>([]);
  const notesYetDone = useRef<Note6[] | Note7[]>([]); // まだ判定していないNote
  const notesBigYetDone = useRef<(Note6 | Note7)[]>([]); // 通常判定がおわってbig判定がまだのNote

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
  const chainRef = useRef<number>(0);

  const lateTimes = useRef<number[]>([]);

  const resetNotesAll = useCallback((notes: Note6[] | Note7[]) => {
    // note.done などを書き換えるため、元データを壊さないようdeepcopy
    const notesCopy = notes.map((n) => ({ ...n })) as Note6[] | Note7[];
    setNotesAll(notesCopy.slice());
    notesYetDone.current = notesCopy;
    notesBigYetDone.current = [];
    setJudgeCount([0, 0, 0, 0]);
    setChain(0);
    chainRef.current = 0;
    setBonus(0);
    setBigCount(0);
    setBigTotal(notesCopy.filter((n) => n.big).length);
  }, []);

  // Noteに判定を保存し、scoreとchainを更新
  const judge = useCallback(
    (n: Note6 | Note7, now: number, j: number) => {
      if (n.big && n.done > 0) {
        n.bigDone = true;
        if (j <= 2) {
          setBigCount((big) => big + 1);
          n.bigBonus =
            ((1 / (bigTotal || 1)) * bigScoreRate) /
            ((1 / notesTotal) * baseScoreRate);
        }
      } else {
        // j = 1 ~ 4
        if (j <= 3) {
          n.hitPos = (
            n.ver === 6 ? displayNote6(n, now) : displayNote7(n, now)
          )?.pos; // 位置を固定
        }
        n.done = j;
        let thisChain: number;
        if (j <= 2) {
          thisChain = chainRef.current + 1;
          n.chain = thisChain;
          n.chainBonus =
            ((Math.min(thisChain, bonusMax) / bonusTotal) * chainScoreRate) /
            ((1 / notesTotal) * baseScoreRate);
          setBonus((bonus) => bonus + Math.min(thisChain, bonusMax));
          if (j === 1) {
            n.baseScore = 1;
          } else {
            n.baseScore = okBaseScore;
          }
        } else {
          thisChain = 0;
        }
        chainRef.current = thisChain;
        setChain(thisChain);
        setJudgeCount((judgeCount) => {
          judgeCount = judgeCount.slice() as [number, number, number, number];
          judgeCount[j - 1]++;
          return judgeCount;
        });
      }
    },
    [bonusTotal, notesTotal, bigTotal]
  );

  // キーを押したときの判定
  const hit = () => {
    const now = getCurrentTimeSec();
    let candidate: Note6 | Note7 | null = null;
    let candidateJudge: number = 0;
    let candidateLate: number | null = null;
    while (now !== undefined && notesYetDone.current.length >= 1) {
      const n = notesYetDone.current[0];
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec) {
        console.log(`Good (${late} s)`);
        candidate = n;
        candidateJudge = 1;
        candidateLate = late;
        break;
      } else if (Math.abs(late) <= okSec) {
        console.log(`OK (${late} s)`);
        candidate = n;
        candidateJudge = 2;
        candidateLate = late;
        break;
      } else if (late <= badLateSec && late >= badFastSec) {
        console.log(`Bad (${late} s)`);
        candidate = n;
        candidateJudge = 3;
        candidateLate = late;
        break;
      } else if (late > badLateSec) {
        // miss
        console.log("miss in hit()");
        judge(n, now, 4);
        notesYetDone.current.shift();
        candidateLate = late;
        continue;
      } else {
        // not yet
        break;
      }
    }
    let candidateBig: Note6 | Note7 | null = null;
    let candidateJudgeBig: number = 0;
    let candidateLateBig: number | null = null;
    while (now !== undefined && notesBigYetDone.current.length >= 1) {
      const n = notesBigYetDone.current[0];
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec) {
        console.log(`Big Good (${late} s)`);
        candidateBig = n;
        candidateJudgeBig = 1;
        candidateLateBig = late;
        break;
      } else if (Math.abs(late) <= okSec) {
        console.log(`Big OK (${late} s)`);
        candidateBig = n;
        candidateJudgeBig = 2;
        candidateLateBig = late;
        break;
      } else if (late <= badLateSec && late >= badFastSec) {
        console.log(`Big Bad (${late} s)`);
        candidateBig = n;
        candidateJudgeBig = 3;
        candidateLateBig = late;
        break;
      } else if (late > badLateSec) {
        // miss
        console.log("Big miss in hit()");
        judge(n, now, 4);
        notesBigYetDone.current.shift();
        candidateLateBig = late;
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
      if(candidateLate !== null){
        lateTimes.current.push(candidateLate + userOffset);
      }
    } else if (now && candidateBig !== null) {
      judge(candidateBig, now, candidateJudgeBig);
      notesBigYetDone.current.shift();
      if(candidateLateBig !== null){
        lateTimes.current.push(candidateLateBig + userOffset);
      }
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
    lateTimes,
  };
}
