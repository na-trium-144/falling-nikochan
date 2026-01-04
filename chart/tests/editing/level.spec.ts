import { expect, test, describe } from "vitest";
import { EventType, LevelEditing } from "@falling-nikochan/chart";
import { dummyChartData, dummyLuaExecutor } from "./dummy";

describe("LevelEditing", () => {
  describe("constructor", () => {
    test("should trigger callback on event emitted", () => {
      let rerendered = false;
      let changed = false;
      const level = new LevelEditing(
        dummyChartData.levels[0],
        (type: EventType) => {
          if (type === "rerender") rerendered = true;
          if (type === "change") changed = true;
        },
        () => 0,
        { current: dummyLuaExecutor() }
      );
      level.emit("rerender");
      expect(rerendered).toBe(true);
      level.emit("change");
      expect(changed).toBe(true);
    });
    test("should initialize properties not in level data", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => 0,
        { current: dummyLuaExecutor() }
      );
      expect(level.seqNotes).to.have.lengthOf(
        dummyChartData.levels[0].notes.length
      );
      expect(level.difficulty).toBeGreaterThanOrEqual(1);
      expect(level.maxHitNum).toBe(2);
      expect(level.lengthSec).toBe(2);
      expect(level.ytDuration).toBe(0);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(level.barLines).to.not.be.empty;
    });
    test("should initialize cursor object", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => 0,
        { current: dummyLuaExecutor() }
      );
      expect(level.current.timeSec).toBe(0);
    });
  });

  test("toObject", () => {
    const level = new LevelEditing(
      dummyChartData.levels[0],
      () => {},
      () => 0,
      { current: dummyLuaExecutor() }
    );
    const obj = level.toObject();
    expect(obj.name).toBe("level1");
    expect(obj.notes).toEqual(dummyChartData.levels[0].notes);
  });

  describe("updateMeta", () => {
    test("should update meta data", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => 0,
        { current: dummyLuaExecutor() }
      );
      level.updateMeta({ name: "new name" });
      expect(level.meta.name).toBe("new name");
    });
    test("should trigger rerender and change events", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => 0,
        { current: dummyLuaExecutor() }
      );
      let rerendered = false;
      let changed = false;
      level.on("rerender", () => {
        rerendered = true;
      });
      level.on("change", () => {
        changed = true;
      });
      level.updateMeta({ name: "new title" });
      expect(rerendered).toBe(true);
      expect(changed).toBe(true);
    });
    test("should reset ytEndSec when ytEnd is changed", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => 0,
        { current: dummyLuaExecutor() }
      );
      level.updateMeta({ ytEnd: "note" });
      expect(level.meta.ytEndSec).toBe(level.lengthSec);
      level.updateMeta({ ytEnd: "yt" });
      expect(level.meta.ytEndSec).toBe(level.ytDuration);
      level.updateMeta({ ytEnd: 15 });
      expect(level.meta.ytEndSec).toBe(15);
    });
  });
  describe("updateFreeze", () => {
    test("should trigger rerender and change events", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => 0,
        { current: dummyLuaExecutor() }
      );
      let rerendered = false;
      let changed = false;
      level.on("rerender", () => {
        rerendered = true;
      });
      level.on("change", () => {
        changed = true;
      });
      level.updateFreeze({ ...level.freeze });
      expect(rerendered).toBe(true);
      expect(changed).toBe(true);
    });
  });
});
