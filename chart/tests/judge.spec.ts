import { test, describe } from "node:test";
import { expect } from "chai";
import {
  Judge,
  HitCandidate,
  goodSec,
  okSec,
  badFastSec,
  badLateSec,
  goodSecThru,
  okSecThru,
  NoteInGame,
} from "@falling-nikochan/chart";

function createDummyNote(
  options: Partial<NoteInGame> & { hitTimeSec: number }
): NoteInGame {
  return {
    id: options.id ?? 0,
    hitTimeSec: options.hitTimeSec,
    appearTimeSec: options.appearTimeSec ?? options.hitTimeSec - 2,
    targetX: options.targetX ?? 0.5,
    vx: options.vx ?? 0,
    vy: options.vy ?? 1,
    ay: options.ay ?? 0.25,
    uRange: options.uRange ?? null,
    display: options.display ?? [{ timeSecBefore: 0, u0: 0, du: 1, ddu: 0 }],
    step: options.step ?? [0, 1],
    big: options.big ?? false,
    hitX: options.hitX ?? 0,
    hitVX: options.hitVX ?? 0,
    hitVY: options.hitVY ?? 0,
    fall: options.fall ?? false,
    done: options.done ?? 0,
    bigDone: options.bigDone ?? false,
    ...options,
  };
}

describe("Judge", () => {
  describe("hit timing windows", () => {
    test("should judge Good (1) when hit within goodSec", () => {
      const note = createDummyNote({ id: 1, hitTimeSec: 2.0 });
      const judged: HitCandidate[] = [];
      const sePlayed: string[] = [];

      const judge = new Judge([note], {
        onJudge: (c) => judged.push(c),
        onPlaySE: (se) => sePlayed.push(se),
      });

      const res = judge.hit(2.0 + goodSec * 0.5);
      expect(res).to.not.be.null;
      expect(res?.judge).to.equal(1);
      expect(res?.note.id).to.equal(1);
      expect(judged).to.have.lengthOf(1);
      expect(judged[0].judge).to.equal(1);
      expect(judge.notesYetDone).to.have.lengthOf(0);
      expect(sePlayed).to.deep.equal(["hit"]);
    });

    test("should judge OK (2) when hit outside goodSec but within okSec", () => {
      const note = createDummyNote({ id: 1, hitTimeSec: 2.0 });
      const judged: HitCandidate[] = [];

      const judge = new Judge([note], {
        onJudge: (c) => judged.push(c),
      });

      const res = judge.hit(2.0 + (goodSec + okSec) / 2);
      expect(res?.judge).to.equal(2);
      expect(judged[0].judge).to.equal(2);
      expect(judge.notesYetDone).to.have.lengthOf(0);
    });

    test("should judge Bad (3) when hit outside okSec but within bad window (early)", () => {
      const note = createDummyNote({ id: 1, hitTimeSec: 2.0 });
      const judged: HitCandidate[] = [];

      const judge = new Judge([note], {
        onJudge: (c) => judged.push(c),
      });

      const res = judge.hit(2.0 + badFastSec * 0.8);
      expect(res?.judge).to.equal(3);
      expect(judged[0].judge).to.equal(3);
      expect(judge.notesYetDone).to.have.lengthOf(0);
    });

    test("should judge Bad (3) when hit outside okSec but within bad window (late)", () => {
      const note = createDummyNote({ id: 1, hitTimeSec: 2.0 });
      const judged: HitCandidate[] = [];

      const judge = new Judge([note], {
        onJudge: (c) => judged.push(c),
      });

      const res = judge.hit(2.0 + (okSec + badLateSec) / 2);
      expect(res?.judge).to.equal(3);
      expect(judged[0].judge).to.equal(3);
      expect(judge.notesYetDone).to.have.lengthOf(0);
    });

    test("should not judge if hit is too early (before badFastSec)", () => {
      const note = createDummyNote({ id: 1, hitTimeSec: 2.0 });
      const judged: HitCandidate[] = [];

      const judge = new Judge([note], {
        onJudge: (c) => judged.push(c),
      });

      const res = judge.hit(2.0 + badFastSec - 0.1);
      expect(res).to.be.null;
      expect(judged).to.have.lengthOf(0);
      expect(judge.notesYetDone).to.have.lengthOf(1);
    });

    test("should mark missed notes if hit is past badLateSec and judge subsequent note", () => {
      const note1 = createDummyNote({ id: 1, hitTimeSec: 1.0 });
      const note2 = createDummyNote({ id: 2, hitTimeSec: 2.0 });
      const judged: HitCandidate[] = [];

      const judge = new Judge([note1, note2], {
        onJudge: (c) => judged.push(c),
      });

      // Hit at 2.0: note1 is too late (now - 1.0 = 1.0 > badLateSec), so it is a Miss (4), note2 is Good (1)
      const res = judge.hit(2.0);
      expect(res?.note.id).to.equal(2);
      expect(res?.judge).to.equal(1);
      expect(judged).to.have.lengthOf(2);
      expect(judged[0].note.id).to.equal(1);
      expect(judged[0].judge).to.equal(4);
      expect(judged[1].note.id).to.equal(2);
      expect(judged[1].judge).to.equal(1);
      expect(judge.notesYetDone).to.have.lengthOf(0);
    });

    test("should return null and play 'hit' SE when hitting with empty notes", () => {
      const sePlayed: string[] = [];
      const judge = new Judge([], {
        onPlaySE: (se) => sePlayed.push(se),
      });

      const res = judge.hit(1.0);
      expect(res).to.be.null;
      expect(sePlayed).to.deep.equal(["hit"]);
    });
  });

  describe("big notes", () => {
    test("should queue big note into notesBigYetDone upon first hit and judge big on second hit", () => {
      const bigNote = createDummyNote({ id: 1, hitTimeSec: 2.0, big: true });
      const judged: HitCandidate[] = [];
      const sePlayed: string[] = [];

      const judge = new Judge([bigNote], {
        onJudge: (c) => judged.push(c),
        onPlaySE: (se) => sePlayed.push(se),
      });

      // First hit: regular hit on big note
      const res1 = judge.hit(2.0);
      expect(res1?.judge).to.equal(1);
      expect(judge.notesYetDone).to.have.lengthOf(0);
      expect(judge.notesBigYetDone).to.have.lengthOf(1);
      expect(judged).to.have.lengthOf(1);
      expect(sePlayed).to.deep.equal(["hit"]);

      // Second hit: big note hit
      const res2 = judge.hit(2.01);
      expect(res2?.judge).to.equal(1);
      expect(judge.notesBigYetDone).to.have.lengthOf(0);
      expect(judged).to.have.lengthOf(2);
      expect(judged[1].note.bigDone).to.be.true;
      expect(sePlayed).to.deep.equal(["hit", "hitBig"]);
    });

    test("should miss big note if second hit is too late (> okSec)", () => {
      const bigNote = createDummyNote({ id: 1, hitTimeSec: 2.0, big: true });
      const judged: HitCandidate[] = [];

      const judge = new Judge([bigNote], {
        onJudge: (c) => judged.push(c),
      });

      judge.hit(2.0);
      expect(judge.notesBigYetDone).to.have.lengthOf(1);

      // Hit at 2.0 + okSec + 0.05 => big note is missed (judge = 4)
      const res2 = judge.hit(2.0 + okSec + 0.05);
      expect(res2).to.be.null;
      expect(judge.notesBigYetDone).to.have.lengthOf(0);
      expect(judged).to.have.lengthOf(2);
      expect(judged[1].judge).to.equal(4);
    });
  });

  describe("iOS Thru hit compensation", () => {
    test("should detect Thru hit with iosRelease followed by hit", () => {
      const note0 = createDummyNote({ id: 1, hitTimeSec: 1.0 });
      const note1 = createDummyNote({ id: 2, hitTimeSec: 1.06 });
      const judged: HitCandidate[] = [];
      const sePlayed: string[] = [];

      const judge = new Judge([note0, note1], {
        onJudge: (c) => judged.push(c),
        onPlaySE: (se) => sePlayed.push(se),
      });

      // Release near note0
      judge.iosRelease(1.01);

      // Tap near note1
      const res = judge.hit(1.06);
      expect(res?.note.id).to.equal(2);
      expect(judged).to.have.lengthOf(2);
      expect(judged[0].note.id).to.equal(1);
      expect(judged[1].note.id).to.equal(2);
      expect(judge.notesYetDone).to.have.lengthOf(0);
      expect(judge.iosThruNote?.id).to.equal(2);
      expect(sePlayed).to.deep.equal(["hit"]);
    });

    test("should absorb false-positive extra hit via candidatePrevThru", () => {
      const note0 = createDummyNote({ id: 1, hitTimeSec: 1.0 });
      const note1 = createDummyNote({ id: 2, hitTimeSec: 1.06 });
      const judged: HitCandidate[] = [];

      const judge = new Judge([note0, note1], {
        onJudge: (c) => judged.push(c),
      });

      judge.iosRelease(1.01);
      judge.hit(1.06);
      expect(judged).to.have.lengthOf(2);
      expect(judge.iosThruNote?.id).to.equal(2);

      // Extra tap at 1.07 (prev thru window of note 2)
      const resExtra = judge.hit(1.07);
      expect(resExtra).to.be.null;
      expect(judge.iosThruNote).to.be.null;
      // No extra note was judged
      expect(judged).to.have.lengthOf(2);
    });
  });

  describe("playbackRate scaling", () => {
    test("should scale judgment timing windows according to playbackRate", () => {
      const note = createDummyNote({ id: 1, hitTimeSec: 2.0 });
      const judged: HitCandidate[] = [];

      const judge = new Judge([note], {
        playbackRate: 2.0,
        onJudge: (c) => judged.push(c),
      });

      // At playbackRate 2.0, goodSec becomes 0.08
      const res = judge.hit(2.0 + 0.07);
      expect(res?.judge).to.equal(1);
      expect(judged[0].judge).to.equal(1);
    });
  });

  describe("checkMiss", () => {
    test("should mark missed notes and return remaining time to next miss", () => {
      const note1 = createDummyNote({ id: 1, hitTimeSec: 1.0 });
      const note2 = createDummyNote({ id: 2, hitTimeSec: 3.0 });
      const judged: HitCandidate[] = [];

      const judge = new Judge([note1, note2], {
        onJudge: (c) => judged.push(c),
      });

      // At now = 1.2 (> 1.0 + badLateSec), note1 should be missed
      const nextMissTimes = judge.checkMiss(1.2);
      expect(judged).to.have.lengthOf(1);
      expect(judged[0].note.id).to.equal(1);
      expect(judged[0].judge).to.equal(4);
      expect(judge.notesYetDone).to.have.lengthOf(1);
      expect(nextMissTimes).to.have.lengthOf(1);
      // next miss time for note2 at 3.0: badLateSec - (1.2 - 3.0) = 0.15 + 1.8 = 1.95
      expect(nextMissTimes[0]).to.be.closeTo(1.95, 0.001);
    });

    test("should check missed big notes in checkMiss", () => {
      const bigNote = createDummyNote({ id: 1, hitTimeSec: 1.0, big: true });
      const judged: HitCandidate[] = [];

      const judge = new Judge([bigNote], {
        onJudge: (c) => judged.push(c),
      });

      judge.hit(1.0);
      expect(judge.notesBigYetDone).to.have.lengthOf(1);

      // At now = 1.0 + okSec + 0.02, big note is missed
      judge.checkMiss(1.0 + okSec + 0.02);
      expect(judge.notesBigYetDone).to.have.lengthOf(0);
      expect(judged).to.have.lengthOf(2);
      expect(judged[1].judge).to.equal(4);
    });
  });

  describe("reset", () => {
    test("should reset state and skip notes before start time", () => {
      const note1 = createDummyNote({ id: 1, hitTimeSec: 0.5 });
      const note2 = createDummyNote({ id: 2, hitTimeSec: 1.5 });
      const judged: HitCandidate[] = [];

      const judge = new Judge([], {
        onJudge: (c) => judged.push(c),
      });

      judge.reset([note1, note2], 1.0);
      expect(judge.notesYetDone).to.have.lengthOf(1);
      expect(judge.notesYetDone[0].id).to.equal(2);
      expect(judged).to.have.lengthOf(1);
      expect(judged[0].note.id).to.equal(1);
      expect(judged[0].judge).to.equal(5);
    });
  });
});
