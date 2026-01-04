import { expect, test, describe } from "vitest";
import { CursorState, SignatureState, stepZero } from "@falling-nikochan/chart";
import { LevelEditing } from "../../src/editing/level";
import { dummyChartData, dummyLuaExecutor } from "./dummy";

describe("CursorState", () => {
  const level = new LevelEditing(
    dummyChartData.levels[0],
    () => {},
    () => 0,
    { current: dummyLuaExecutor() }
  );
  describe("reset", () => {
    test("should reset timeSec", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(1, 2, level.freeze, [...level.lua]);
      expect(cursor.timeSec).toBe(1);
    });
    test("should reset snapDivider", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(1, 3, level.freeze, [...level.lua]);
      expect(cursor.snapDivider).toBe(3);
    });
    test("should find step", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.step).toEqual({ fourth: 1, numerator: 0, denominator: 1 });
    });
    test("should set note index and index bounds", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.noteIndex).toBe(1);
      expect(cursor.notesIndexBegin).toBe(1);
      expect(cursor.notesIndexEnd).toBe(3);
    });
    test("should set lualine of current note", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.line).toBe(1);
    });
    test("should set signature state", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(0.5, 2, level.freeze, [...level.lua]);
      expect(cursor.signatureState).toEqual({
        barNum: 0,
        bar: [4],
        stepAligned: stepZero(),
        offset: { fourth: 0, numerator: 1, denominator: 2 },
        count: { fourth: 0, numerator: 1, denominator: 2 },
      } satisfies SignatureState);
    });
    test("should set bpm index", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.bpmIndex).toBe(1);
    });
    test("should set speed index", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.speedIndex).toBe(1);
    });
    test("should set signature index", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(cursor.signatureIndex).toBe(1);
    });
    test("should emit rerender event", () => {
      const cursor = new CursorState(() => {});
      let rerendered = false;
      cursor.on("rerender", () => {
        rerendered = true;
      });
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      expect(rerendered).toBe(true);
    });
  });
  describe("setNoteIndex", () => {
    test("should set note index within bounds", () => {
      const cursor = new CursorState(() => {});
      cursor.reset(1, 1, level.freeze, [...level.lua]);
      cursor.setNoteIndex(1);
      expect(cursor.noteIndex).toBe(1);
      cursor.setNoteIndex(0);
      expect(cursor.noteIndex).toBe(1);
      cursor.setNoteIndex(2);
      expect(cursor.noteIndex).toBe(2);
      cursor.setNoteIndex(3);
      expect(cursor.noteIndex).toBe(2);
    });
  });
});
