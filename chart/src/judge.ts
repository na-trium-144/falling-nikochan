import {
  goodSec,
  okSec,
  badFastSec,
  badLateSec,
  goodSecThru,
  okSecThru,
} from "./gameConstant.js";
import { displayNote, NoteInGame } from "./seq.js";

export interface HitCandidate {
  note: NoteInGame;
  judge: 1 | 2 | 3 | 4 | 5;
  late: number;
}

export interface JudgeOptions {
  playbackRate?: number;
  notes?: NoteInGame[];
  onJudge?: (candidate: HitCandidate, now: number) => void;
  onPlaySE?: (se: "hit" | "hitBig") => void;
}

export class Judge {
  notesYetDone: NoteInGame[] = [];
  notesBigYetDone: NoteInGame[] = [];
  iosThruNote: NoteInGame | null = null;
  iosPrevRelease: number | null = null;
  playbackRate: number = 1;
  onJudge?: (candidate: HitCandidate, now: number) => void;
  onPlaySE?: (se: "hit" | "hitBig") => void;

  constructor(
    notesOrOptions?: NoteInGame[] | JudgeOptions,
    options?: JudgeOptions
  ) {
    if (Array.isArray(notesOrOptions)) {
      this.reset(notesOrOptions);
      if (options) {
        if (options.playbackRate !== undefined) {
          this.playbackRate = options.playbackRate;
        }
        this.onJudge = options.onJudge;
        this.onPlaySE = options.onPlaySE;
      }
    } else if (notesOrOptions) {
      if (notesOrOptions.playbackRate !== undefined) {
        this.playbackRate = notesOrOptions.playbackRate;
      }
      this.onJudge = notesOrOptions.onJudge;
      this.onPlaySE = notesOrOptions.onPlaySE;
      if (notesOrOptions.notes) {
        this.reset(notesOrOptions.notes);
      }
    }
  }

  reset(notes: NoteInGame[], now?: number): void {
    // note.done などを書き換えるため、元データを壊さないようdeepcopy
    this.notesYetDone = notes.map((n) => ({ ...n }));
    this.notesBigYetDone = [];
    this.iosThruNote = null;
    this.iosPrevRelease = null;

    // 開始時よりも前の音符を判定済みにする
    if (now !== undefined) {
      while (
        this.notesYetDone.length > 0 &&
        this.notesYetDone[0].hitTimeSec < now
      ) {
        const n = this.notesYetDone.shift()!;
        this.judge({ note: n, judge: 5, late: 0 }, now);
      }
    }
  }

  iosRelease(now: number): void {
    this.iosPrevRelease = now;
  }

  judge(c: HitCandidate, now: number): void {
    if (c.note.big && c.note.done > 0) {
      c.note.bigDone = true;
    } else {
      if (c.judge <= 3 && c.note.display?.length) {
        c.note.hitPos = displayNote(c.note, c.note.hitTimeSec + c.late)?.pos;
      }
      c.note.done = c.judge;
    }
    this.onJudge?.(c, now);
  }

  hit(now: number): HitCandidate | null {
    let candidate: HitCandidate | null = null;
    while (this.notesYetDone.length >= 1) {
      const n = this.notesYetDone[0];
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec * this.playbackRate) {
        candidate = { note: n, judge: 1, late };
        break;
      } else if (Math.abs(late) <= okSec * this.playbackRate) {
        candidate = { note: n, judge: 2, late };
        break;
      } else if (
        late <= badLateSec * this.playbackRate &&
        late >= badFastSec * this.playbackRate
      ) {
        candidate = { note: n, judge: 3, late };
        break;
      } else if (late > badLateSec * this.playbackRate) {
        this.judge({ note: n, judge: 4, late }, now);
        this.notesYetDone.shift();
        continue;
      } else {
        // not yet
        break;
      }
    }

    // 1つ前の音符でThru判定が誤爆し1つ余分に消してしまった可能性を考慮
    // (音符1つ分しか考慮していないので、1つ目thru判定発生->2つ目ok->3つ目good みたいなケースはどうしようもない)
    let candidatePrevThru: HitCandidate | null = null;
    if (this.iosThruNote) {
      const n = this.iosThruNote;
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec * this.playbackRate) {
        candidatePrevThru = { note: n, judge: 1, late };
      } else if (Math.abs(late) <= okSec * this.playbackRate) {
        candidatePrevThru = { note: n, judge: 2, late };
      } else if (
        late <= badLateSec * this.playbackRate &&
        late >= badFastSec * this.playbackRate
      ) {
        candidatePrevThru = { note: n, judge: 3, late };
      }
      this.iosThruNote = null;
    }

    let candidateThru0: HitCandidate | null = null;
    let candidateThru1: HitCandidate | null = null;
    if (this.iosPrevRelease !== null && this.notesYetDone.length >= 2) {
      const n0 = this.notesYetDone[0];
      const n1 = this.notesYetDone[1];
      const late0 = this.iosPrevRelease - n0.hitTimeSec;
      const late1 = now - n1.hitTimeSec;
      if (
        Math.abs(late0) <= okSecThru * this.playbackRate &&
        late1 <= badLateSec * this.playbackRate &&
        late1 >= badFastSec * this.playbackRate
      ) {
        // iosPrevReleaseのタイミングで1つ目の音符を、今2つ目の音符を叩いたことにする
        // iosPrevReleaseで使う判定基準は通常のgood,okよりも厳しめ (悪用を防ぐため)
        if (Math.abs(late0) <= goodSecThru * this.playbackRate) {
          candidateThru0 = { note: n0, judge: 1, late: late0 };
        } else {
          candidateThru0 = { note: n0, judge: 2, late: late0 };
        }
        if (Math.abs(late1) <= goodSec * this.playbackRate) {
          candidateThru1 = { note: n1, judge: 1, late: late1 };
        } else if (Math.abs(late1) <= okSec * this.playbackRate) {
          candidateThru1 = { note: n1, judge: 2, late: late1 };
        } else {
          candidateThru1 = { note: n1, judge: 3, late: late1 };
        }
      }
      this.iosPrevRelease = null;
    }

    // 通常音符は最も早いものを優先するのに対し、
    // big音符の判定では最もlate=0に近いものを優先する
    let candidateBig: HitCandidate | null = null;
    for (let i = 0; i < this.notesBigYetDone.length;) {
      const n = this.notesBigYetDone[i];
      const late = now - n.hitTimeSec;
      if (Math.abs(late) <= goodSec * this.playbackRate) {
        candidateBig = { note: n, judge: 1, late };
        i++;
      } else if (Math.abs(late) <= okSec * this.playbackRate) {
        candidateBig = { note: n, judge: 2, late };
        i++;
      } else if (late > okSec * this.playbackRate) {
        // big判定にbadは無い
        // miss
        if (i === 0) {
          this.judge({ note: n, judge: 4, late }, now);
          this.notesBigYetDone.shift();
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
      this.onPlaySE?.("hit");
      this.judge(candidateThru0, now);
      this.notesYetDone.shift();
      if (candidateThru0.note.big) {
        this.notesBigYetDone.push(candidateThru0.note);
      }
      this.judge(candidateThru1, now);
      this.iosThruNote = candidateThru1.note;
      this.notesYetDone.shift();
      if (candidateThru1.note.big) {
        this.notesBigYetDone.push(candidateThru1.note);
      }
      return candidateThru1;
    } else if (
      candidatePrevThru &&
      (!candidate ||
        Math.abs(candidatePrevThru.judge) < Math.abs(candidate.judge)) &&
      (!candidateBig ||
        Math.abs(candidatePrevThru.judge) < Math.abs(candidateBig.judge))
    ) {
      this.onPlaySE?.("hit");
      return null;
    } else if (
      candidate &&
      (!candidateBig ||
        Math.abs(candidate.judge) <= Math.abs(candidateBig.judge)) // ここは等号の場合bigでない通常判定を優先
    ) {
      this.onPlaySE?.("hit");
      this.judge(candidate, now);
      this.notesYetDone.shift();
      if (candidate.note.big) {
        this.notesBigYetDone.push(candidate.note);
      }
      return candidate;
    } else if (candidateBig) {
      this.onPlaySE?.("hitBig");
      this.judge(candidateBig, now);
      this.notesBigYetDone = this.notesBigYetDone.filter(
        (n) => n !== candidateBig!.note
      );
      return candidateBig;
    } else {
      this.onPlaySE?.("hit");
      return null;
    }
  }

  checkMiss(now: number): number[] {
    const nextMissTime: number[] = [];
    while (this.notesYetDone.length >= 1) {
      const n = this.notesYetDone[0];
      const lateThru =
        this.iosPrevRelease !== null
          ? this.iosPrevRelease - n.hitTimeSec
          : null;
      const late = now - n.hitTimeSec;
      if (late > badLateSec * this.playbackRate) {
        if (
          lateThru !== null &&
          Math.abs(lateThru) <= goodSecThru * this.playbackRate
        ) {
          this.judge({ note: n, judge: 1, late: lateThru }, now);
        } else if (
          lateThru !== null &&
          Math.abs(lateThru) <= okSecThru * this.playbackRate
        ) {
          this.judge({ note: n, judge: 2, late: lateThru }, now);
        } else {
          this.judge({ note: n, judge: 4, late }, now);
        }
        this.notesYetDone.shift();
        this.iosPrevRelease = null;
        continue;
      } else {
        nextMissTime.push(badLateSec * this.playbackRate - late);
        break;
      }
    }
    while (this.notesBigYetDone.length >= 1) {
      const n = this.notesBigYetDone[0];
      const late = now - n.hitTimeSec;
      if (late > okSec * this.playbackRate) {
        // big判定にbadは無い
        this.judge({ note: n, judge: 4, late }, now);
        this.notesBigYetDone.shift();
        continue;
      } else {
        nextMissTime.push(okSec * this.playbackRate - late);
        break;
      }
    }
    return nextMissTime;
  }
}
