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
        () => dummyChartData.offset,
        dummyLuaExecutor()
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
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      expect(level.seqNotes).to.have.lengthOf(
        dummyChartData.levels[0].notes.length
      );
      expect(level.difficulty).toBeGreaterThanOrEqual(1);
      expect(level.maxHitNum).toBe(2);
      expect(level.lengthSec).toBe(dummyChartData.offset + 2);
      expect(level.ytDuration).toBe(0);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(level.barLines).to.not.be.empty;
    });
    test("should initialize cursor object", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      expect(level.current.timeSec).toBe(-dummyChartData.offset);
    });
  });

  test("toObject", () => {
    const level = new LevelEditing(
      dummyChartData.levels[0],
      () => {},
      () => dummyChartData.offset,
      dummyLuaExecutor()
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
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      level.updateMeta({ name: "new name" });
      expect(level.meta.name).toBe("new name");
    });
    test("should trigger rerender and change events", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor()
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
        () => dummyChartData.offset,
        dummyLuaExecutor()
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
        () => dummyChartData.offset,
        dummyLuaExecutor()
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
    test("should update freeze data", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      const newNotes = [
        ...dummyChartData.levels[0].notes,
        {
          step: { fourth: 5, numerator: 0, denominator: 1 },
          big: false,
          hitX: -1,
          hitVX: 1,
          hitVY: 3,
          fall: true,
          luaLine: null,
        },
      ];
      level.updateFreeze({ notes: newNotes });
      expect(level.freeze.notes).toEqual(newNotes);
      expect(level.freeze.notes.at(-1)).toEqual({
        step: { fourth: 5, numerator: 0, denominator: 1 },
        big: false,
        hitX: -1,
        hitVX: 1,
        hitVY: 3,
        fall: true,
        luaLine: null,
      });
    });
    test("should update properties not in level data", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      level.updateFreeze({
        notes: [
          ...dummyChartData.levels[0].notes,
          ...Array.from(new Array(5)).map(() => ({
            step: { fourth: 5, numerator: 0, denominator: 1 },
            big: false,
            hitX: -1,
            hitVX: 1,
            hitVY: 3,
            fall: true,
            luaLine: null,
          })),
        ],
      });
      expect(level.seqNotes).to.have.lengthOf(
        dummyChartData.levels[0].notes.length + 5
      );
      expect(level.difficulty).toBeGreaterThanOrEqual(10);
      expect(level.maxHitNum).toBe(5);
      expect(level.lengthSec).toBe(3 + dummyChartData.offset);
      expect(level.ytDuration).toBe(0);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(level.barLines).to.not.be.empty;
    });
    test("should initialize cursor object", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      level.setCurrentTimeWithoutOffset(3 + dummyChartData.offset);
      expect(level.current.timeSec).toBe(3);
      expect(level.current.noteIndex).toBeUndefined();
      level.updateFreeze({
        notes: [
          ...dummyChartData.levels[0].notes,
          {
            step: { fourth: 5, numerator: 0, denominator: 1 },
            big: false,
            hitX: -1,
            hitVX: 1,
            hitVY: 3,
            fall: true,
            luaLine: null,
          },
        ],
      });
      expect(level.current.timeSec).toBe(3);
      expect(level.current.noteIndex).toBe(
        dummyChartData.levels[0].notes.length
      );
    });
  });
  describe("updateLua", () => {
    test("should abort current execution", () => {
      let aborted = false;
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor(
          async () => null,
          () => {
            aborted = true;
          }
        )
      );
      level.updateLua([...level.lua, "print('new line')"]);
      expect(aborted).toBe(true);
    });
    test("should try to execute new lua", async () => {
      let executedCode = "";
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor(async (code: string) => {
          executedCode = code;
          return null;
        })
      );
      await level.updateLua(["print('new line')", "print('new line 2')"]);
      expect(executedCode).toBe("print('new line')\nprint('new line 2')");
    });
    test("should update lua and freeze data", async () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor(async () => ({
          notes: [
            ...dummyChartData.levels[0].notes,
            {
              step: { fourth: 5, numerator: 0, denominator: 1 },
              big: false,
              hitX: -1,
              hitVX: 1,
              hitVY: 3,
              fall: true,
              luaLine: null,
            },
          ],
          rest: dummyChartData.levels[0].rest,
          bpmChanges: dummyChartData.levels[0].bpmChanges,
          speedChanges: dummyChartData.levels[0].speedChanges,
          signature: dummyChartData.levels[0].signature,
        }))
      );
      const newLua = [...level.lua, "print('new line')"];
      await level.updateLua(newLua);
      expect(level.lua).toEqual(newLua);
      expect(level.freeze.notes).to.have.lengthOf(
        dummyChartData.levels[0].notes.length + 1
      );
    });
    test("should not update lua and freeze data if execution returns null", async () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor(async () => null)
      );
      const newLua = [...level.lua, "print('new line')"];
      await level.updateLua(newLua);
      expect(level.lua).toEqual(dummyChartData.levels[0].lua);
      expect(level.freeze.notes).to.have.lengthOf(
        dummyChartData.levels[0].notes.length
      );
    });
  });

  describe("setYTDuration", () => {
    test("should update ytDuration and ytEndSec if ytEnd is 'yt'", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      level.updateMeta({ ytEnd: "yt" });
      level.setYTDuration(20);
      expect(level.ytDuration).toBe(20);
      expect(level.meta.ytEndSec).toBe(20);
    });
    test("should update ytDuration but not ytEndSec if ytEnd is 'note'", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      level.updateMeta({ ytEnd: "note" });
      level.setYTDuration(20);
      expect(level.ytDuration).toBe(20);
      expect(level.meta.ytEndSec).toBe(level.lengthSec);
    });
    test("should update ytDuration but not ytEndSec if ytEnd is a number", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      level.updateMeta({ ytEnd: 30 });
      level.setYTDuration(20);
      expect(level.ytDuration).toBe(20);
      expect(level.meta.ytEndSec).toBe(30);
    });
  });
  describe("setSnapDivider", () => {
    test("should update snapDivider of current cursor", () => {
      const level = new LevelEditing(
        dummyChartData.levels[0],
        () => {},
        () => dummyChartData.offset,
        dummyLuaExecutor()
      );
      level.setCurrentTimeWithoutOffset(dummyChartData.offset + 1);
      expect(level.current.timeSec).toBe(1);
      level.setSnapDivider(4);
      expect(level.current.snapDivider).toBe(4);
      expect(level.current.timeSec).toBe(1);
    });
  });

  // TODO: more tests for LevelEditing methods
});
