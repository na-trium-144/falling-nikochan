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
  okSecThru,
  goodSecThru,
} from "@falling-nikochan/chart";
import { displayNote6, Note6 } from "@falling-nikochan/chart";
import { displayNote13, Note13 } from "@falling-nikochan/chart";
import { SEType } from "@/common/se";

export default function useGameLogic(
  getCurrentTimeSec: () => number | undefined,
  auto: boolean,
  // 判定を行う際offsetはgetCurrentTimeSecの戻り値に含まれているので、
  // ここで指定するuserOffsetは判定には影響しない
  userOffset: number,
  playbackRate: number,
  playSE: (s: SEType) => void
) {
  const [notesAll, setNotesAll] = useState<Note6[] | Note13[]>([]);
  const notesYetDone = useRef<Note6[] | Note13[]>([]); // まだ判定していないNote
  const notesBigYetDone = useRef<(Note6 | Note13)[]>([]); // 通常判定がおわってbig判定がまだのNote
  const iosThruNote = useRef<Note6 | Note13 | null>(null); // iosThru判定が発生した場合の音符 (判定終了済みではあり、notesYetDoneには含まれない)

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

  const resetNotesAll = useCallback((notes: Note6[] | Note13[]) => {
    // note.done などを書き換えるため、元データを壊さないようdeepcopy
    const notesCopy = notes.map((n) => ({ ...n })) as Note6[] | Note13[];
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
    (c: HitCandidate) => {
      if (c.note.big && c.note.done > 0) {
        c.note.bigDone = true;
        if (c.judge <= 2) {
          setBigCount((big) => big + 1);
          c.note.bigBonus =
            ((1 / (bigTotal || 1)) * bigScoreRate) /
            ((1 / notesTotal) * baseScoreRate);
        }
      } else {
        // c.judge = 1 ~ 4
        if (c.judge <= 3) {
          c.note.hitPos = (
            c.note.ver === 6
              ? displayNote6(c.note, c.note.hitTimeSec + c.late)
              : displayNote13(c.note, c.note.hitTimeSec + c.late)
          )?.pos; // 位置を固定
        }
        c.note.done = c.judge;
        let thisChain: number;
        if (c.judge <= 2) {
          thisChain = chainRef.current + 1;
          c.note.chain = thisChain;
          c.note.chainBonus =
            ((Math.min(thisChain, bonusMax) / bonusTotal) * chainScoreRate) /
            ((1 / notesTotal) * baseScoreRate);
          setBonus((bonus) => bonus + Math.min(thisChain, bonusMax));
          if (c.judge === 1) {
            c.note.baseScore = 1;
          } else {
            c.note.baseScore = okBaseScore;
          }
        } else {
          thisChain = 0;
        }
        chainRef.current = thisChain;
        setChain(thisChain);
        setJudgeCount((judgeCount) => {
          judgeCount = judgeCount.slice() as [number, number, number, number];
          judgeCount[c.judge - 1]++;
          return judgeCount;
        });
      }
    },
    [bonusTotal, notesTotal, bigTotal]
  );

  const iosPrevRelease = useRef<number | null>(null);
  const iosRelease = useCallback(() => {
    const now = getCurrentTimeSec();
    if (now !== undefined) {
      iosPrevRelease.current = now;
    }
  }, [getCurrentTimeSec]);
  interface HitCandidate {
    note: Note6 | Note13;
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
      while (now !== undefined && notesYetDone.current.length >= 1) {
        const n = notesYetDone.current[0];
        const late = now - n.hitTimeSec;
        if (Math.abs(late) <= goodSec * playbackRate) {
          candidate = { note: n, judge: 1, late };
          break;
        } else if (Math.abs(late) <= okSec * playbackRate) {
          candidate = { note: n, judge: 2, late };
          break;
        } else if (
          late <= badLateSec * playbackRate &&
          late >= badFastSec * playbackRate
        ) {
          candidate = { note: n, judge: 3, late };
          break;
        } else if (late > badLateSec * playbackRate) {
          console.log("miss in hit()");
          judge({ note: n, judge: 4, late });
          notesYetDone.current.shift();
          continue;
        } else {
          // not yet
          break;
        }
      }
      // 1つ前の音符でThru判定が誤爆し1つ余分に消してしまった可能性を考慮
      // (音符1つ分しか考慮していないので、1つ目thru判定発生->2つ目ok->3つ目good みたいなケースはどうしようもない)
      let candidatePrevThru: HitCandidate | null = null;
      if (now !== undefined && iosThruNote.current) {
        const n = iosThruNote.current;
        const late = now - n.hitTimeSec;
        if (Math.abs(late) <= goodSec * playbackRate) {
          candidatePrevThru = { note: n, judge: 1, late };
        } else if (Math.abs(late) <= okSec * playbackRate) {
          candidatePrevThru = { note: n, judge: 2, late };
        } else if (
          late <= badLateSec * playbackRate &&
          late >= badFastSec * playbackRate
        ) {
          candidatePrevThru = { note: n, judge: 3, late };
        }
        iosThruNote.current = null;
      }
      let candidateThru0: HitCandidate | null = null;
      let candidateThru1: HitCandidate | null = null;
      if (
        iosPrevRelease.current !== null &&
        now !== undefined &&
        notesYetDone.current.length >= 2
      ) {
        const n0 = notesYetDone.current[0];
        const n1 = notesYetDone.current[1];
        const late0 = iosPrevRelease.current - n0.hitTimeSec;
        const late1 = now - n1.hitTimeSec;
        if (
          Math.abs(late0) <= okSecThru * playbackRate &&
          late1 <= badLateSec * playbackRate &&
          late1 >= badFastSec * playbackRate
        ) {
          // iosPrevReleaseのタイミングで1つ目の音符を、今2つ目の音符を叩いたことにする
          // iosPrevReleaseで使う判定基準は通常のgood,okよりも厳しめ (悪用を防ぐため)
          if (Math.abs(late0) <= goodSecThru * playbackRate) {
            candidateThru0 = { note: n0, judge: 1, late: late0 };
          } else {
            candidateThru0 = { note: n0, judge: 2, late: late0 };
          }
          if (Math.abs(late1) <= goodSec * playbackRate) {
            candidateThru1 = { note: n1, judge: 1, late: late1 };
          } else if (Math.abs(late1) <= okSec * playbackRate) {
            candidateThru1 = { note: n1, judge: 2, late: late1 };
          } else {
            candidateThru1 = { note: n1, judge: 3, late: late1 };
          }
        }
        iosPrevRelease.current = null;
      }

      // 通常音符は最も早いものを優先するのに対し、
      // big音符の判定では最もlate=0に近いものを優先する
      let candidateBig: HitCandidate | null = null;
      for (
        let i = 0;
        now !== undefined && i < notesBigYetDone.current.length;
      ) {
        const n = notesBigYetDone.current[i];
        const late = now - n.hitTimeSec;
        if (Math.abs(late) <= goodSec * playbackRate) {
          candidateBig = { note: n, judge: 1, late };
          i++;
        } else if (Math.abs(late) <= okSec * playbackRate) {
          candidateBig = { note: n, judge: 2, late };
          i++;
        } else if (late > okSec * playbackRate) {
          // big判定にbadは無い
          // miss
          if (i === 0) {
            console.log("Big miss in hit()");
            judge({ note: n, judge: 4, late });
            notesBigYetDone.current.shift();
          } else {
            // 音符は早い順に並んでいるので必ずi=0のはず?だが一応
            i++;
          }
          continue;
        } else {
          // late < badFastSec ... not yet
          break;
        }
        // 判定線を過ぎているなら、それより後(=判定線に近い)の音符もチェックしcandidateBigを上書きする
        // そうでなければbreak
        if (late > 0) {
          continue;
        } else {
          break;
        }
      }

      // candidateThru, candidate, candidateJudgeBig のうち近いものを判定する
      // 通常のcandidateが最優先
      if (
        now &&
        candidateThru0 &&
        candidateThru1 &&
        (!candidatePrevThru ||
          (Math.abs(candidateThru0.judge) <=
            Math.abs(candidatePrevThru.judge) &&
            Math.abs(candidateThru1.judge) <
              Math.abs(candidatePrevThru.judge))) &&
        (!candidate ||
          (Math.abs(candidateThru0.judge) <= Math.abs(candidate.judge) &&
            Math.abs(candidateThru1.judge) < Math.abs(candidate.judge))) && // ここは等号の場合thruでない通常判定を優先
        (!candidateBig ||
          (Math.abs(candidateThru0.judge) <= Math.abs(candidateBig.judge) &&
            Math.abs(candidateThru1.judge) < Math.abs(candidateBig.judge)))
      ) {
        playSE("hit");
        console.log(
          "hit thru",
          candidateThru0.judge,
          candidateThru1.judge,
          candidate?.judge,
          candidateBig?.judge
        );
        judge(candidateThru0);
        notesYetDone.current.shift();
        if (candidateThru0.note.big) {
          notesBigYetDone.current.push(candidateThru0.note);
        }
        judge(candidateThru1);
        iosThruNote.current = candidateThru1.note;
        notesYetDone.current.shift();
        if (candidateThru1.note.big) {
          notesBigYetDone.current.push(candidateThru1.note);
        }
        lateTimes.current.push(
          candidateThru1.late / playbackRate + userOffset /* + audioLatency */
        );
      } else if (
        now &&
        candidatePrevThru &&
        (!candidate ||
          Math.abs(candidatePrevThru.judge) < Math.abs(candidate.judge)) &&
        (!candidateBig ||
          Math.abs(candidatePrevThru.judge) < Math.abs(candidateBig.judge))
      ) {
        playSE("hit");
        console.log("prev thru");
      } else if (
        now &&
        candidate &&
        (!candidateBig ||
          Math.abs(candidate.judge) <= Math.abs(candidateBig.judge)) // ここは等号の場合bigでない通常判定を優先
      ) {
        playSE("hit");
        console.log("hit", candidate.judge, candidateBig?.judge);
        judge(candidate);
        notesYetDone.current.shift();
        if (candidate.note.big) {
          notesBigYetDone.current.push(candidate.note);
        }
        lateTimes.current.push(
          candidate.late / playbackRate + userOffset /* + audioLatency */
        );
      } else if (now && candidateBig) {
        playSE("hitBig");
        console.log("hitBig", candidateBig.judge);
        judge(candidateBig);
        notesBigYetDone.current = notesBigYetDone.current.filter(
          (n) => n !== candidateBig.note
        );
        lateTimes.current.push(
          candidateBig.late / playbackRate + userOffset /* + audioLatency */
        );
      } else {
        playSE("hit");
      }
    },
    [getCurrentTimeSec, judge, userOffset, playSE, playbackRate]
  );

  // badLateSec以上過ぎたものをmiss判定にする
  useEffect(() => {
    if (auto) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const removeOneNote = () => {
      timer = null;
      const now = getCurrentTimeSec();
      const nextMissTime: number[] = [];
      while (now !== undefined && notesYetDone.current.length >= 1) {
        const n = notesYetDone.current[0];
        const lateThru = iosPrevRelease.current
          ? iosPrevRelease.current - n.hitTimeSec
          : null;
        const late = now - n.hitTimeSec;
        if (late > badLateSec * playbackRate) {
          if (lateThru && Math.abs(lateThru) <= goodSecThru * playbackRate) {
            console.log("hit thru in interval", 1);
            judge({ note: n, judge: 1, late: lateThru });
          } else if (
            lateThru &&
            Math.abs(lateThru) <= okSecThru * playbackRate
          ) {
            console.log("hit thru in interval", 2);
            judge({ note: n, judge: 2, late: lateThru });
          } else {
            console.log("miss in interval");
            judge({ note: n, judge: 4, late });
          }
          notesYetDone.current.shift();
          iosPrevRelease.current = null;
          continue;
        } else {
          nextMissTime.push(badLateSec * playbackRate - late);
          break;
        }
      }
      while (now !== undefined && notesBigYetDone.current.length >= 1) {
        const n = notesBigYetDone.current[0];
        const late = now - n.hitTimeSec;
        if (late > okSec * playbackRate) {
          // big判定にbadは無い
          console.log("Big miss in interval");
          judge({ note: n, judge: 4, late });
          notesBigYetDone.current.shift();
          continue;
        } else {
          nextMissTime.push(okSec * playbackRate - late);
          break;
        }
      }
      if (nextMissTime.length > 0) {
        timer = setTimeout(
          removeOneNote,
          (Math.min(...nextMissTime) * 1000) / playbackRate
        );
      }
    };
    removeOneNote();
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [auto, getCurrentTimeSec, judge, playbackRate]);
  useEffect(() => {
    if (auto) {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const removeOneNote = () => {
        console.log("auto");
        timer = null;
        const now = getCurrentTimeSec();
        const nextHitTime: number[] = [];
        while (now !== undefined && notesYetDone.current.length >= 1) {
          const n = notesYetDone.current[0];
          const late = now - n.hitTimeSec;
          if (late >= 0) {
            playSE("hit");
            judge({ note: n, judge: 1, late: 0 });
            notesYetDone.current.shift();
            if (n.big) {
              notesBigYetDone.current.push(n);
            }
            continue;
          } else {
            nextHitTime.push(-late);
            break;
          }
        }
        while (now !== undefined && notesBigYetDone.current.length >= 1) {
          const n = notesBigYetDone.current[0];
          const late = now - n.hitTimeSec;
          if (late >= 0) {
            playSE("hitBig");
            judge({ note: n, judge: 1, late: 0 });
            notesBigYetDone.current.shift();
            continue;
          } else {
            nextHitTime.push(-late);
            break;
          }
        }
        if (nextHitTime.length > 0) {
          timer = setTimeout(
            removeOneNote,
            (Math.min(...nextHitTime) * 1000) / playbackRate
          );
        }
      };
      removeOneNote();
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [auto, getCurrentTimeSec, hit, playbackRate]);

  return {
    baseScore,
    chainScore,
    bigScore,
    score,
    chain,
    notesAll,
    resetNotesAll,
    hit,
    iosRelease,
    judgeCount,
    bigCount: bigTotal === 0 ? null : bigCount,
    bigTotal,
    chartEnd,
    lateTimes,
    hitType,
  };
}
