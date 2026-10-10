import {
  goodSec,
  okSec,
  badFastSec,
  badLateSec,
  goodSecThru,
  okSecThru,
  bigScoreRate,
  bonusMax,
  chainScoreRate,
  baseScoreRate,
  okBaseScore,
} from "./gameConstant.js";
import { displayNote, NoteInGame } from "./seq.js";

export interface HitCandidate {
  note: NoteInGame;
  judge: 1 | 2 | 3 | 4 | 5;
  late: number;
}

/**
 * 外部からJudgeにセット・同期する必要があるパラメータとコールバック
 */
export interface JudgeOptions {
  judgeForAuto: boolean;
  playbackRate: number;
  onJudge: (
    candidate: HitCandidate,
    now: number,
    bigHit: boolean,
    thisChain: number
  ) => void;
  onPlaySE: (se: "hit" | "hitBig") => void;
  onFlash: (x: { targetX: number }) => void;
}
export const defaultJudgeOpts: JudgeOptions = {
  judgeForAuto: false,
  playbackRate: 1,
  onJudge: () => console.error("Judge.opts.onJudge not initialized"),
  onPlaySE: () => console.error("Judge.opts.onPlaySE not initialized"),
  onFlash: () => console.error("Judge.opts.onFlash not initialized"),
};

export class Judge {
  notesAll: NoteInGame[];
  notesTotal: number;
  bonusTotal: number;
  bigTotal: number;
  currentChain: number = 0;
  /**
   * まだ判定していないNote
   */
  #notesYetDone: NoteInGame[] = [];
  /**
   * 通常判定が終わってBig判定がまだのNote
   */
  #notesBigYetDone: NoteInGame[] = [];
  /**
   * iosThru判定が発生した場合の音符
   * (判定終了済みではあり、notesYetDoneには含まれない)
   */
  #iosThruNote: NoteInGame | null = null;
  #iosPrevRelease: number | null = null;

  opts: JudgeOptions;

  constructor(notes: NoteInGame[], opts?: JudgeOptions, now?: number) {
    // note.done などを書き換えるため、このクラスの外にある元データを壊さないようdeepcopy
    // このクラスの内部では同じnoteを表すNoteInGameのインスタンスは常に1つとする
    this.notesAll = structuredClone(notes);
    this.#notesYetDone = this.notesAll.slice();
    this.#notesBigYetDone = [];
    this.#iosThruNote = null;
    this.#iosPrevRelease = null;

    this.opts = opts ?? defaultJudgeOpts;

    this.notesTotal = notes.length;
    this.bigTotal = notes.filter((n) => n.big).length;
    this.bonusTotal =
      this.notesTotal < bonusMax
        ? (this.notesTotal * (this.notesTotal + 1)) / 2
        : (bonusMax * (bonusMax + 1)) / 2 +
          bonusMax * (this.notesTotal - bonusMax);
    this.currentChain = 0;

    // 開始時よりも前の音符を判定済みにする
    if (now !== undefined) {
      while (
        this.#notesYetDone.length > 0 &&
        this.#notesYetDone[0].hitTimeSec < now
      ) {
        const n = this.#notesYetDone.shift()!;
        this.#judge({ note: n, judge: 5, late: 0 }, now);
      }
    }
  }

  iosRelease(now: number): void {
    this.#iosPrevRelease = now;
  }

  /**
   * Noteに判定を保存し、onJudgeコールバックを呼び出す
   */
  #judge(c: HitCandidate, now: number): void {
    let thisChain: number = 0;
    if (c.note.big && c.note.done > 0) {
      c.note.bigDone = true;
      if (c.judge <= 2) {
        c.note.bigBonus = (1 / (this.bigTotal || 1)) * bigScoreRate; //  / ((1 / notesTotal) * baseScoreRate)
      }
      this.opts.onJudge(c, now, true, thisChain);
    } else {
      // c.judge = 1 ~ 4
      if (c.judge <= 3) {
        // 位置を固定
        c.note.hitPos = displayNote(c.note, c.note.hitTimeSec + c.late)?.pos;
      }
      c.note.done = c.judge;
      if (c.judge <= 2) {
        thisChain = this.currentChain + 1;
        c.note.chain = thisChain;
        c.note.chainBonus =
          (Math.min(thisChain, bonusMax) / this.bonusTotal) * chainScoreRate; //  / ((1 / notesTotal) * baseScoreRate)
        if (c.judge === 1) {
          c.note.baseScore = (1 / this.notesTotal) * baseScoreRate;
        } else {
          c.note.baseScore = (okBaseScore / this.notesTotal) * baseScoreRate;
        }
      } else {
        thisChain = 0;
      }
      this.currentChain = thisChain;
      this.opts.onJudge(c, now, false, thisChain);
    }
  }

  hit(now: number): {
    candidate: HitCandidate | null;
    type: "thru" | "prevThru" | "normal" | "big" | null;
  } {
    let candidate: HitCandidate | null = null;
    while (this.#notesYetDone.length >= 1) {
      const n = this.#notesYetDone[0];
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec * this.opts.playbackRate) {
        candidate = { note: n, judge: 1, late };
        break;
      } else if (Math.abs(late) <= okSec * this.opts.playbackRate) {
        candidate = { note: n, judge: 2, late };
        break;
      } else if (
        late <= badLateSec * this.opts.playbackRate &&
        late >= badFastSec * this.opts.playbackRate
      ) {
        candidate = { note: n, judge: 3, late };
        break;
      } else if (late > badLateSec * this.opts.playbackRate) {
        console.log("miss in hit()");
        this.#judge({ note: n, judge: 4, late }, now);
        this.#notesYetDone.shift();
        continue;
      } else {
        // not yet
        break;
      }
    }

    // 1つ前の音符でThru判定が誤爆し1つ余分に消してしまった可能性を考慮
    // (音符1つ分しか考慮していないので、1つ目thru判定発生->2つ目ok->3つ目good みたいなケースはどうしようもない)
    let candidatePrevThru: HitCandidate | null = null;
    if (this.#iosThruNote) {
      const n = this.#iosThruNote;
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec * this.opts.playbackRate) {
        candidatePrevThru = { note: n, judge: 1, late };
      } else if (Math.abs(late) <= okSec * this.opts.playbackRate) {
        candidatePrevThru = { note: n, judge: 2, late };
      } else if (
        late <= badLateSec * this.opts.playbackRate &&
        late >= badFastSec * this.opts.playbackRate
      ) {
        candidatePrevThru = { note: n, judge: 3, late };
      }
      this.#iosThruNote = null;
    }

    let candidateThru0: HitCandidate | null = null;
    let candidateThru1: HitCandidate | null = null;
    if (this.#iosPrevRelease !== null && this.#notesYetDone.length >= 2) {
      const n0 = this.#notesYetDone[0];
      const n1 = this.#notesYetDone[1];
      const late0 = this.#iosPrevRelease - n0.hitTimeSec;
      const late1 = now - n1.hitTimeSec;
      if (
        Math.abs(late0) <= okSecThru * this.opts.playbackRate &&
        late1 <= badLateSec * this.opts.playbackRate &&
        late1 >= badFastSec * this.opts.playbackRate
      ) {
        // iosPrevReleaseのタイミングで1つ目の音符を、今2つ目の音符を叩いたことにする
        // iosPrevReleaseで使う判定基準は通常のgood,okよりも厳しめ (悪用を防ぐため)
        if (Math.abs(late0) <= goodSecThru * this.opts.playbackRate) {
          candidateThru0 = { note: n0, judge: 1, late: late0 };
        } else {
          candidateThru0 = { note: n0, judge: 2, late: late0 };
        }
        if (Math.abs(late1) <= goodSec * this.opts.playbackRate) {
          candidateThru1 = { note: n1, judge: 1, late: late1 };
        } else if (Math.abs(late1) <= okSec * this.opts.playbackRate) {
          candidateThru1 = { note: n1, judge: 2, late: late1 };
        } else {
          candidateThru1 = { note: n1, judge: 3, late: late1 };
        }
      }
      this.#iosPrevRelease = null;
    }

    // 通常音符は最も早いものを優先するのに対し、
    // big音符の判定では最もlate=0に近いものを優先する
    let candidateBig: HitCandidate | null = null;
    for (let i = 0; i < this.#notesBigYetDone.length;) {
      const n = this.#notesBigYetDone[i];
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec * this.opts.playbackRate) {
        candidateBig = { note: n, judge: 1, late };
        i++;
      } else if (Math.abs(late) <= okSec * this.opts.playbackRate) {
        candidateBig = { note: n, judge: 2, late };
        i++;
      } else if (late > okSec * this.opts.playbackRate) {
        // big判定にbadは無い
        // miss
        if (i === 0) {
          console.log("Big miss in hit()");
          this.#judge({ note: n, judge: 4, late }, now);
          this.#notesBigYetDone.shift();
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
      candidateThru0 &&
      candidateThru1 &&
      (!candidatePrevThru ||
        (Math.abs(candidateThru0.judge) <= Math.abs(candidatePrevThru.judge) &&
          Math.abs(candidateThru1.judge) <
            Math.abs(candidatePrevThru.judge))) &&
      (!candidate ||
        (Math.abs(candidateThru0.judge) <= Math.abs(candidate.judge) &&
          Math.abs(candidateThru1.judge) < Math.abs(candidate.judge))) && // ここは等号の場合thruでない通常判定を優先
      (!candidateBig ||
        (Math.abs(candidateThru0.judge) <= Math.abs(candidateBig.judge) &&
          Math.abs(candidateThru1.judge) < Math.abs(candidateBig.judge)))
    ) {
      this.opts.onPlaySE("hit");
      console.log(
        "hit thru",
        candidateThru0.judge,
        candidateThru1.judge,
        candidate?.judge,
        candidateBig?.judge
      );
      this.#judge(candidateThru0, now);
      this.#notesYetDone.shift();
      if (candidateThru0.note.big) {
        this.#notesBigYetDone.push(candidateThru0.note);
      }
      this.#judge(candidateThru1, now);
      this.#iosThruNote = candidateThru1.note;
      this.#notesYetDone.shift();
      if (candidateThru1.note.big) {
        this.#notesBigYetDone.push(candidateThru1.note);
      }
      return { candidate: candidateThru1, type: "thru" };
    } else if (
      candidatePrevThru &&
      (!candidate ||
        Math.abs(candidatePrevThru.judge) < Math.abs(candidate.judge)) &&
      (!candidateBig ||
        Math.abs(candidatePrevThru.judge) < Math.abs(candidateBig.judge))
    ) {
      this.opts.onPlaySE("hit");
      console.log("prev thru");
      return { candidate: null, type: "prevThru" };
    } else if (
      candidate &&
      (!candidateBig ||
        Math.abs(candidate.judge) <= Math.abs(candidateBig.judge)) // ここは等号の場合bigでない通常判定を優先
    ) {
      this.opts.onPlaySE("hit");
      console.log("hit", candidate.judge, candidateBig?.judge);
      this.#judge(candidate, now);
      this.#notesYetDone.shift();
      if (candidate.note.big) {
        this.#notesBigYetDone.push(candidate.note);
      }
      return { candidate: candidate, type: "normal" };
    } else if (candidateBig) {
      this.opts.onPlaySE("hitBig");
      console.log("hitBig", candidateBig.judge);
      this.#judge(candidateBig, now);
      this.#notesBigYetDone = this.#notesBigYetDone.filter(
        (n) => n !== candidateBig!.note
      );
      return { candidate: candidateBig, type: "big" };
    } else {
      this.opts.onPlaySE("hit");
      return { candidate: null, type: null };
    }
  }

  checkMiss(now: number): number | null {
    const nextMissTime: number[] = [];
    while (this.#notesYetDone.length >= 1) {
      const n = this.#notesYetDone[0];
      const lateThru =
        this.#iosPrevRelease !== null
          ? this.#iosPrevRelease - n.hitTimeSec
          : null;
      const late = now - n.hitTimeSec;
      if (late > badLateSec * this.opts.playbackRate) {
        if (
          lateThru !== null &&
          Math.abs(lateThru) <= goodSecThru * this.opts.playbackRate
        ) {
          console.log("hit thru in interval", 1);
          this.#judge({ note: n, judge: 1, late: lateThru }, now);
        } else if (
          lateThru !== null &&
          Math.abs(lateThru) <= okSecThru * this.opts.playbackRate
        ) {
          console.log("hit thru in interval", 2);
          this.#judge({ note: n, judge: 2, late: lateThru }, now);
        } else {
          console.log("miss in interval");
          this.#judge({ note: n, judge: 4, late }, now);
        }
        this.#notesYetDone.shift();
        this.#iosPrevRelease = null;
        continue;
      } else {
        nextMissTime.push(badLateSec * this.opts.playbackRate - late);
        break;
      }
    }
    while (this.#notesBigYetDone.length >= 1) {
      const n = this.#notesBigYetDone[0];
      const late = now - n.hitTimeSec;
      if (late > okSec * this.opts.playbackRate) {
        // big判定にbadは無い
        console.log("Big miss in interval");
        this.#judge({ note: n, judge: 4, late }, now);
        this.#notesBigYetDone.shift();
        continue;
      } else {
        nextMissTime.push(okSec * this.opts.playbackRate - late);
        break;
      }
    }
    return nextMissTime.length > 0 ? Math.min(...nextMissTime) : null;
  }

  checkAuto(now: number): number | null {
    const nextHitTime: number[] = [];
    while (this.#notesYetDone.length >= 1) {
      const n = this.#notesYetDone[0];
      const late = now - n.hitTimeSec;
      if (late >= 0) {
        if (this.opts.judgeForAuto) {
          this.hit(now);
        } else {
          this.opts.onPlaySE("hit");
          this.#judge({ note: n, judge: 1, late: 0 }, now);
          this.#notesYetDone.shift();
          if (n.big) {
            this.#notesBigYetDone.push(n);
          }
        }
        this.opts.onFlash({ targetX: n.targetX });
        continue;
      } else {
        nextHitTime.push(-late);
        break;
      }
    }
    while (this.#notesBigYetDone.length >= 1) {
      const n = this.#notesBigYetDone[0];
      const late = now - n.hitTimeSec;
      if (late >= 0) {
        if (this.opts.judgeForAuto) {
          this.hit(now);
        } else {
          this.opts.onPlaySE("hitBig");
          this.#judge({ note: n, judge: 1, late: 0 }, now);
          this.#notesBigYetDone.shift();
        }
        this.opts.onFlash({ targetX: n.targetX });
        continue;
      } else {
        nextHitTime.push(-late);
        break;
      }
    }
    return nextHitTime.length > 0 ? Math.min(...nextHitTime) : null;
  }
}
