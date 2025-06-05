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
} from "@falling-nikochan/chart";
import { displayNote6, Note6 } from "@falling-nikochan/chart";
import { displayNote7, Note7 } from "@falling-nikochan/chart";
import { SEType } from "./se";

export default function useGameLogic(
  getCurrentTimeSec: () => number | undefined,
  auto: boolean,
  // 判定を行う際offsetはgetCurrentTimeSecの戻り値に含まれているので、
  // ここで指定するuserOffsetは判定には影響しない
  userOffset: number,
  playSE: (s: SEType) => void
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
  const hitCountByType = useRef<Record<number, number>>({});
  const [hitType, setHitType] = useState<number | null>(null);

  const chartEnd = judgeCount.reduce((sum, j) => sum + j, 0) == notesTotal;

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
    hitCountByType.current = {};
    setHitType(null);
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

  const iosPrevRelease = useRef<number | null>(null);
  const release = useCallback(() => {
    const now = getCurrentTimeSec();
    if (now !== undefined) {
      iosPrevRelease.current = now;
    }
  }, [getCurrentTimeSec]);
  interface HitCandidate {
    note: Note6 | Note7;
    judge: 1 | 2 | 3 | 4;
    late: number;
  }
  // キーを押したときの判定
  const hit = useCallback(
    (type: number) => {
      const now = getCurrentTimeSec();
      if (now !== undefined) {
        hitCountByType.current[type] = (hitCountByType.current[type] || 0) + 1;
        setHitType(
          Number(
            Object.keys(hitCountByType.current).reduce((a, b) =>
              hitCountByType.current[Number(a)] >
              hitCountByType.current[Number(b)]
                ? a
                : b
            )
          )
        );
      }
      let candidate: HitCandidate | null = null;
      let candidateThru: HitCandidate | null = null;
      while (now !== undefined && notesYetDone.current.length >= 1) {
        const n = notesYetDone.current[0];
        const late = now - n.hitTimeSec;
        if (Math.abs(late) <= goodSec) {
          candidate = { note: n, judge: 1, late };
          break;
        } else if (Math.abs(late) <= okSec) {
          candidate = { note: n, judge: 2, late };
          break;
        } else if (late <= badLateSec && late >= badFastSec) {
          candidate = { note: n, judge: 3, late };
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
      if (
        iosPrevRelease.current !== null &&
        now !== undefined &&
        notesYetDone.current.length >= 2 &&
        candidate
      ) {
        const n0 = notesYetDone.current[0];
        const n1 = notesYetDone.current[1];
        const late0 = iosPrevRelease.current - n0.hitTimeSec;
        const late1 = now - n1.hitTimeSec;
        if (
          Math.abs(late0) <= okSec &&
          Math.abs(late1) <= Math.abs(candidate.late) &&
          late1 <= badLateSec &&
          late1 >= badFastSec
        ) {
          // iosPrevReleaseのタイミングで1つ目の音符を、今2つ目の音符を叩いたことにする
          if (Math.abs(late0) <= goodSec) {
            candidateThru = { note: n0, judge: 1, late: late0 };
          } else {
            candidateThru = { note: n0, judge: 2, late: late0 };
          }
          if (Math.abs(late1) <= goodSec) {
            candidate = { note: n1, judge: 1, late: late1 };
          } else if (Math.abs(late1) <= okSec) {
            candidate = { note: n1, judge: 2, late: late1 };
          } else {
            candidate = { note: n1, judge: 3, late: late1 };
          }
        }
        iosPrevRelease.current = null;
      }

      let candidateBig: HitCandidate | null = null;
      while (now !== undefined && notesBigYetDone.current.length >= 1) {
        const n = notesBigYetDone.current[0];
        const late = now - n.hitTimeSec;
        if (Math.abs(late) <= goodSec) {
          candidateBig = { note: n, judge: 1, late };
          break;
        } else if (Math.abs(late) <= okSec) {
          candidateBig = { note: n, judge: 2, late };
          break;
        } else if (late <= badLateSec && late >= badFastSec) {
          candidateBig = { note: n, judge: 3, late };
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
        candidate &&
        (!candidateBig ||
          Math.abs(candidate.late) <= Math.abs(candidateBig.judge))
      ) {
        playSE("hit");
        console.log("hit", candidate.judge);
        judge(candidate.note, now, candidate.judge);
        notesYetDone.current.shift();
        if (candidate.note.big) {
          notesBigYetDone.current.push(candidate.note);
        }
        lateTimes.current.push(
          candidate.late + userOffset /* + audioLatency */
        );
        if (candidateThru) {
          console.log("hit thru", candidate.judge);
          judge(candidateThru.note, now, candidateThru.judge);
          notesYetDone.current.shift();
          if (candidateThru.note.big) {
            notesBigYetDone.current.push(candidateThru.note);
          }
        }
      } else if (now && candidateBig) {
        playSE("hitBig");
        console.log("hitBig", candidateBig.judge);
        judge(candidateBig.note, now, candidateBig.judge);
        notesBigYetDone.current.shift();
        lateTimes.current.push(
          candidateBig.late + userOffset /* + audioLatency */
        );
      } else {
        playSE("hit");
      }
    },
    [getCurrentTimeSec, judge, userOffset, playSE]
  );
  // 0.1s以上過ぎたものをmiss判定にする
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const removeOneNote = () => {
      timer = null;
      const now = getCurrentTimeSec();
      let nextMissTime: number | null = null;
      while (now !== undefined && notesYetDone.current.length >= 1) {
        const n = notesYetDone.current[0];
        const lateThru = iosPrevRelease.current
          ? iosPrevRelease.current - n.hitTimeSec
          : null;
        const late = now - n.hitTimeSec;
        if (late > badLateSec) {
          if (lateThru && Math.abs(lateThru) <= goodSec) {
            console.log("hit thru in interval", 1);
            judge(n, now, 1);
          } else if (lateThru && Math.abs(lateThru) <= okSec) {
            console.log("hit thru in interval", 2);
            judge(n, now, 2);
          } else if (
            lateThru &&
            lateThru <= badLateSec &&
            lateThru >= badFastSec
          ) {
            console.log("hit thru in interval", 3);
            judge(n, now, 3);
          } else {
            console.log("miss in interval");
            judge(n, now, 4);
          }
          notesYetDone.current.shift();
          iosPrevRelease.current = null;
          continue;
        } else if (auto && late >= 0) {
          console.log("auto");
          playSE("hit");
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
          playSE("hitBig");
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
  }, [auto, getCurrentTimeSec, judge, playSE]);

  return {
    baseScore,
    chainScore,
    bigScore,
    score,
    chain,
    notesAll,
    resetNotesAll,
    hit,
    release,
    judgeCount,
    bigCount: bigTotal === 0 ? null : bigCount,
    bigTotal,
    chartEnd,
    lateTimes,
    hitType,
  };
}
