import { test, describe } from "node:test";
import { expect } from "chai";
import { CursorState, SignatureState, stepZero } from "@falling-nikochan/chart";
import { LevelEditing } from "../../src/editing/level";
import { dummyChartData, dummyLuaExecutor } from "./dummy";

describe("CursorState", () => {
  const level = new LevelEditing(
    dummyChartData.levels[0],
    () => {},
    () => 0,
    dummyLuaExecutor()
  );
  describe("reset", () => {
    test("should reset timeSec", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(1, 2, level.freeze, [...level.lua]);
      expect(cursor.timeSec).to.equal(1);
    });
    test("should reset snapDivider", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(1, 3, level.freeze, [...level.lua]);
      expect(cursor.snapDivider).to.equal(3);
    });
    test("should find step", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.step).to.deep.equal({
        fourth: 1,
        numerator: 0,
        denominator: 1,
      });
    });
    test("should set note index and index bounds", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.noteIndex).to.equal(1);
      expect(cursor.notesIndexBegin).to.equal(1);
      expect(cursor.notesIndexEnd).to.equal(3);

      cursor.reset(1, 4, level.freeze, [...level.lua]);
      expect(cursor.noteIndex).to.equal(1);
      expect(cursor.notesIndexBegin).to.equal(1);
      expect(cursor.notesIndexEnd).to.equal(3);
    });
    test("should set last note index if timeSec goes backward", () => {
      const cursor = new CursorState(
        10,
        level.freeze,
        [...level.lua],
        () => {}
      );
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.noteIndex).to.equal(2);
      expect(cursor.notesIndexBegin).to.equal(1);
      expect(cursor.notesIndexEnd).to.equal(3);
    });
    test("should set lualine of current note", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.line).to.equal(1);
    });
    test("should set signature state", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(0.5, 2, level.freeze, [...level.lua]);
      expect(cursor.signatureState).to.deep.equal({
        barNum: 0,
        bar: [4],
        stepAligned: stepZero(),
        offset: { fourth: 0, numerator: 1, denominator: 2 },
        count: { fourth: 0, numerator: 1, denominator: 2 },
      } satisfies SignatureState);
    });
    test("should set bpm index", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.bpmIndex).to.equal(1);
    });
    test("should set speed index", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.speedIndex).to.equal(1);
    });
    test("should set signature index", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.signatureIndex).to.equal(1);
    });
    test("should emit rerender event", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      let rerendered = false;
      cursor.on("rerender", () => {
        rerendered = true;
      });
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(rerendered).to.equal(true);
    });
  });
  describe("setNoteIndex", () => {
    test("should set note index within bounds", () => {
      const cursor = new CursorState(0, level.freeze, [...level.lua], () => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      cursor.setNoteIndex(1);
      expect(cursor.noteIndex).to.equal(1);
      cursor.setNoteIndex(0);
      expect(cursor.noteIndex).to.equal(1);
      cursor.setNoteIndex(2);
      expect(cursor.noteIndex).to.equal(2);
      cursor.setNoteIndex(3);
      expect(cursor.noteIndex).to.equal(2);
    });
  });
});
