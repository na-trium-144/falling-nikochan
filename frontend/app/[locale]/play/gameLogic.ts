"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  okBaseScore,
  bonusMax,
  baseScoreRate,
  chainScoreRate,
  bigScoreRate,
  displayNote,
  NoteInGame,
  Judge,
  HitCandidate,
} from "@falling-nikochan/chart";
import { SEType } from "@/common/se";
import { OffsetEstimator } from "./offsetEstimator";
import { NoteDone } from "./score";

export default function useGameLogic(
  getCurrentTimeSec: () => number | undefined,
  auto: boolean,
  judgeForAuto: boolean,
  // 判定を行う際offsetはgetCurrentTimeSecの戻り値に含まれているので、
  // ここで指定するuserOffsetは判定には影響しない
  userOffset: number,
  autoOffset: boolean,
  setUserOffset: (v: number) => void,
  playbackRate: number,
  playSE: (s: SEType) => void,
  flash: (x: { targetX: number }) => void
) {
  const [notesDone, setNotesDone] = useState<NoteDone[][]>([]);

  // リセットのたびに新しいインスタンスにする
  const [judge, setJudge] = useState<Judge>(new Judge([]));
  judge.playbackRate = playbackRate;
  judge.onPlaySE = playSE;
  judge.onFlash = flash;

  // good, ok, bad, missの個数
  const [judgeCount, setJudgeCount] = useState<
    [number, number, number, number, number]
  >([0, 0, 0, 0, 0]);
  const judgeScore = judgeCount[0] * 1 + judgeCount[1] * okBaseScore;
  const [bonus, setBonus] = useState<number>(0); // 1 + 2 + ... + 100 + 100 + ...
  const [bigCount, setBigCount] = useState<number>(0);
  const baseScore = (judgeScore / (judge.notesTotal || 1)) * baseScoreRate;
  const chainScore = (bonus / (judge.bonusTotal || 1)) * chainScoreRate;
  const bigScore = (bigCount / (judge.bigTotal || 1)) * bigScoreRate;
  const score = baseScore + chainScore + bigScore;
  const hitCountByType = useRef<Record<number, number>>({});
  const [hitType, setHitType] = useState<number | null>(null);

  const chartEnd =
    judgeCount.reduce((sum, j) => sum + j, 0) == judge.notesTotal;

  const [chain, setChain] = useState<number>(0);
  const [maxChain, setMaxChain] = useState<number>(0);

  const lateTimes = useRef<number[]>([]);
  const timeOfsEstimator = useRef<OffsetEstimator | null>(null);
  const posOfs = useRef<number>(
    0 // * boxSize
  );
  const initTimeOfsEstimator = useCallback(() => {
    timeOfsEstimator.current = new OffsetEstimator(userOffset, 0.01, 0.1, 7.5); // * second
  }, [userOffset]);
  useEffect(() => {
    if (getCurrentTimeSec() === undefined) {
      initTimeOfsEstimator();
    }
  }, [getCurrentTimeSec, initTimeOfsEstimator]);
  const autoAdjustOffset = useCallback(
    (ofs: number, now: number, noteIndex: number) => {
      if (!auto && autoOffset) {
        const late = now - judge.notesAll[noteIndex].hitTimeSec;
        for (let i = noteIndex - 1; i >= 0; i--) {
          const latePrev = now - judge.notesAll[i].hitTimeSec;
          if (latePrev === late) {
            continue;
          } else if (Math.abs(latePrev) < Math.abs(late)) {
            console.log(`prev (${latePrev}) is nearer than current (${late})`);
            return;
          } else {
            break;
          }
        }
        for (let i = noteIndex + 1; i < judge.notesAll.length; i++) {
          const lateNext = now - judge.notesAll[i].hitTimeSec;
          if (lateNext === late) {
            continue;
          } else if (Math.abs(lateNext) < Math.abs(late)) {
            console.log(`next (${lateNext}) is nearer than current (${late})`);
            return;
          } else {
            break;
          }
        }

        // doneを0にすることで判定後であってもvelを計算させる
        const n = { ...judge.notesAll[noteIndex], done: 0 };
        const dn = displayNote(n, now);
        if (timeOfsEstimator.current && dn) {
          const nPosOfs = dn ? -dn.pos.y : 0;
          // ユーザーが認識している判定線位置のずれの予測 (=入力遅延によらず一定になる)
          // timeOfsのkalmanfilterがシフトしていく場合にあとからそれを抑えるため、
          // kalman filterではなく移動平均で更新する
          // TODO: 実際に判定をposOfs分ずらしてあげたほうがよいのではないか?
          if (
            Math.abs(ofs - timeOfsEstimator.current.mu) <
            timeOfsEstimator.current.diff_threshold
          ) {
            const k =
              1 / (1 + Math.max(25, timeOfsEstimator.current.p / 0.0005 ** 2));
            posOfs.current = (1 - k) * posOfs.current + k * nPosOfs;
          }
          // ユーザーの入力の遅延の予測
          const timeOfs = timeOfsEstimator.current.update(
            ofs - posOfs.current / dn.vel.y
          );
          setUserOffset(timeOfs);
        }
      }
    },
    [auto, autoOffset, setUserOffset, judge]
  );

  // scoreとchainを更新
  const onJudge = useCallback(
    (c: HitCandidate, now: number, thisChain: number) => {
      if (c.note.big && c.note.done > 0) {
        if (c.judge <= 2) {
          setBigCount((big) => big + 1);
        }
      } else {
        // c.judge = 1 ~ 4
        if (c.judge <= 2) {
          setBonus((bonus) => bonus + Math.min(thisChain, bonusMax));
        }
        setChain(thisChain);
        setMaxChain((max) => Math.max(max, thisChain));
        setJudgeCount((judgeCount) => {
          judgeCount = judgeCount.slice() as [
            number,
            number,
            number,
            number,
            number,
          ];
          judgeCount[c.judge - 1]++;
          return judgeCount;
        });
      }
      if (c.judge > 0 && c.judge <= 2) {
        setNotesDone((notesDone) => {
          // 同じ時刻の完了した音符の個数を数える
          let indexRow = 0;
          for (const row of notesDone) {
            if (row.find((nd) => nd.id === c.note.id)) {
              row.splice(
                row.findIndex((nd) => nd.id === c.note.id),
                1
              );
              break;
            } else if (row.find((nd) => nd.hitTimeSec === c.note.hitTimeSec)) {
              indexRow++;
              continue;
            } else {
              break;
            }
          }
          if (indexRow >= notesDone.length) {
            notesDone.push([]);
          }
          notesDone[indexRow].push({
            id: c.note.id,
            indexInStep: indexRow,
            hitTimeSec: c.note.hitTimeSec,
            done: c.judge,
            baseScore: c.note.baseScore || 0,
            chainBonus: c.note.chainBonus || 0,
            bigBonus: c.note.bigBonus || 0,
            bigDone: c.note.bigDone || false,
            chain: c.note.chain || 0,
          });

          // console.log(notesDone);

          // 各indexにつき最大3個 or アニメーションが完了するまで のみを表示
          return notesDone.map((row) =>
            row.filter(
              (nd, i) =>
                i >= row.length - 3 ||
                now - nd.hitTimeSec <= 0.25 * playbackRate
            )
          );
        });
      }
    },
    [playbackRate]
  );
  judge.onJudge = onJudge;

  const resetNotesAll = useCallback(
    (notes: NoteInGame[], now: number) => {
      // note.done などを書き換えるため、元データを壊さないようdeepcopy
      setNotesDone([]);
      setJudgeCount([0, 0, 0, 0, 0]);
      setChain(0);
      setMaxChain(0);
      setBonus(0);
      setBigCount(0);
      hitCountByType.current = {};
      setHitType(null);
      initTimeOfsEstimator();
      setJudge(new Judge(notes, now));
    },
    [initTimeOfsEstimator]
  );

  const iosRelease = useCallback(() => {
    const now = getCurrentTimeSec();
    if (now !== undefined) {
      judge.iosRelease(now);
    }
  }, [getCurrentTimeSec]);

  // キーを押したときの判定
  const hit = useCallback<(type: number) => HitCandidate | null>(
    (hitType: number) => {
      const now = getCurrentTimeSec();
      if (now !== undefined) {
        hitCountByType.current[hitType] =
          (hitCountByType.current[hitType] || 0) + 1;
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
      if (now === undefined) return null;
      const { candidate, type } = judge.hit(now);
      if (candidate) {
        lateTimes.current.push(
          candidate.late / playbackRate + userOffset /* + audioLatency */
        );
        if (type === "normal") {
          autoAdjustOffset(
            candidate.late / playbackRate + userOffset /* + audioLatency */,
            now,
            candidate.note.id
          );
        }
      }
      return candidate;
    },
    [getCurrentTimeSec, playbackRate, userOffset, autoAdjustOffset, judge]
  );

  // badLateSec以上過ぎたものをmiss判定にする
  useEffect(() => {
    if (auto) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const removeOneNote = () => {
      timer = null;
      const now = getCurrentTimeSec();
      if (now !== undefined) {
        const nextMissTime = judge.checkMiss(now);
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
  }, [auto, getCurrentTimeSec, playbackRate, judge]);

  useEffect(() => {
    if (auto) {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const removeOneNote = () => {
        timer = null;
        const now = getCurrentTimeSec();
        if (now !== undefined) {
          const nextHitTime = judge.checkAuto(now, judgeForAuto);
          if (nextHitTime !== null) {
            timer = setTimeout(
              removeOneNote,
              (nextHitTime * 1000) / playbackRate
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
    }
  }, [
    auto,
    getCurrentTimeSec,
    hit,
    playbackRate,
    judge,
    playSE,
    flash,
    judgeForAuto,
    judge,
  ]);

  // ビルド後のjsから見つけづらくするためにオブジェクトではなくarrayにしている
  return [
    judge.notesAll,
    resetNotesAll,
    baseScore,
    chainScore,
    bigScore,
    score,
    chain,
    maxChain,
    notesDone,
    hit,
    iosRelease,
    judgeCount,
    judge.bigTotal === 0 ? null : bigCount,
    judge.bigTotal,
    chartEnd,
    lateTimes,
    hitType,
    posOfs,
    timeOfsEstimator,
  ] as const;
}
