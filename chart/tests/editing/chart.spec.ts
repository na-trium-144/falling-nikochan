import { expect, test, describe } from "vitest";
import {
  ChartEditing,
  ChartMin,
  currentChartVer,
  emptyLevel,
  numEvents,
} from "@falling-nikochan/chart";
import { dummyChartData, dummyLuaExecutor } from "./dummy";

describe("ChartEditing", () => {
  describe("constructor", () => {
    test("should set options from parameters", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: "123456",
        currentPasswd: "passwd",
        convertedFrom: 5,
        currentLevelIndex: 1,
        hasChange: true,
      });
      expect(ce.convertedFrom).toBe(5);
      expect(ce.cid).toBe("123456");
      expect(ce.currentPasswd).toBe("passwd");
      // expect(ce.locale).toBe("en");
      expect(ce.hasChange).toBe(true);
      expect(ce.currentLevelIndex).toBe(1);
    });
    test("default values for options", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      expect(ce.convertedFrom).toBe(currentChartVer);
      expect(ce.hasChange).toBe(false);
      expect(ce.currentLevelIndex).toBe(0);
    });
    test("should calculate numEvents", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      expect(ce.numEvents).toBe(numEvents(dummyChartData));
    });
    test("should propagate rerender and change event from levels", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      let rerendered = false;
      let changed = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.levels[0].emit("rerender");
      expect(rerendered).toBe(true);
      ce.levels[0].emit("change");
      expect(changed).toBe(true);
    })
  });
  describe("resetOnSave", () => {
    test("should reset convertedFrom", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        convertedFrom: 1,
      });
      expect(ce.convertedFrom).toBe(1);
      ce.resetOnSave("1");
      expect(ce.convertedFrom).toBe(currentChartVer);
    });
    test("should reset hasChange", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        hasChange: true,
      });
      expect(ce.hasChange).toBe(true);
      ce.resetOnSave("1");
      expect(ce.hasChange).toBe(false);
    });
    test("should move changePasswd to currentPasswd", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: "oldpass",
      });
      ce.setChangePasswd("newpass");
      expect(ce.currentPasswd).toBe("oldpass");
      expect(ce.changePasswd).toBe("newpass");
      ce.resetOnSave("1");
      expect(ce.currentPasswd).toBe("newpass");
      expect(ce.changePasswd).toBeNull();
    });
    test("should keep currentPasswd if changePasswd is null", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: "oldpass",
      });
      expect(ce.currentPasswd).toBe("oldpass");
      expect(ce.changePasswd).toBeNull();
      ce.resetOnSave("1");
      expect(ce.currentPasswd).toBe("oldpass");
      expect(ce.changePasswd).toBeNull();
    });
    test("should set cid", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      expect(ce.cid).toBeUndefined();
      ce.resetOnSave("123");
      expect(ce.cid).toBe("123");
    });
    test("should emit rerender event", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      let rerendered = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.resetOnSave("1");
      expect(rerendered).toBe(true);
    });
  });
  test("toObject", () => {
    const ce = new ChartEditing(dummyChartData, {
      luaExecutorRef: { current: dummyLuaExecutor() },
      locale: "en",
      cid: undefined,
      currentPasswd: null,
    });
    const obj = ce.toObject();
    expect(obj).toEqual({ ...dummyChartData, locale: "en" });
  });
  test("toMin", () => {
    const ce = new ChartEditing(dummyChartData, {
      luaExecutorRef: { current: dummyLuaExecutor() },
      locale: "en",
      cid: undefined,
      currentPasswd: null,
    });
    const min = ce.toMin();
    expect(min).toEqual({
      falling: "nikochan",
      ver: currentChartVer,
      offset: 10,
      ytId: "123456789ab",
      title: "title",
      composer: "composer",
      chartCreator: "chartCreator",
      levels: [
        {
          name: "level1",
          type: "Single",
          unlisted: false,
          ytBegin: 10,
          ytEnd: 20,
          ytEndSec: 20,
          lua: [],
        },
        {
          name: "level2",
          type: "Double",
          unlisted: true,
          ytBegin: 30,
          ytEnd: 40,
          ytEndSec: 40,
          lua: [],
        },
      ],
      locale: "en",
      copyBuffer: dummyChartData.copyBuffer,
    } satisfies ChartMin);
  });
  describe("addLevel", () => {
    test("should add a new level", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      const newLevel = emptyLevel();
      newLevel.name = "New Level";
      ce.addLevel(newLevel);
      expect(ce.levels.length).toBe(3);
      expect(ce.levels[1].meta.name).toBe("New Level");
      expect(ce.currentLevelIndex).toBe(1);
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      let rerendered = false;
      let changed = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.addLevel(emptyLevel());
      expect(rerendered).toBe(true);
      expect(changed).toBe(true);
    });
    test("should update hasChange and numEvents", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      expect(ce.hasChange).toBe(false);
      ce.addLevel(emptyLevel());
      expect(ce.hasChange).toBe(true);
      expect(ce.numEvents).toBeGreaterThan(numEvents(dummyChartData));
    });
  });
  describe("deleteLevel", () => {
    test("should delete the current level", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      ce.deleteLevel();
      expect(ce.levels.length).toBe(1);
      expect(ce.currentLevelIndex).toBe(0);
      expect(ce.levels[0].meta.name).toBe("level1");
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      let rerendered = false;
      let changed = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.deleteLevel();
      expect(rerendered).toBe(true);
      expect(changed).toBe(true);
    });
    test("should update hasChange and numEvents", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      expect(ce.hasChange).toBe(false);
      ce.deleteLevel();
      expect(ce.hasChange).toBe(true);
      expect(ce.numEvents).toBeLessThan(numEvents(dummyChartData));
    });
  });
  describe("moveLevelUp", () => {
    test("should move the current level up", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      ce.moveLevelUp();
      expect(ce.levels[0].meta.name).toBe("level2");
      expect(ce.levels[1].meta.name).toBe("level1");
      expect(ce.currentLevelIndex).toBe(0);
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      let rerendered = false;
      let changed = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.moveLevelUp();
      expect(rerendered).toBe(true);
      expect(changed).toBe(true);
    });
    test("should update hasChange", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      expect(ce.hasChange).toBe(false);
      ce.moveLevelUp();
      expect(ce.hasChange).toBe(true);
    });
  });
  describe("moveLevelDown", () => {
    test("should move the current level down", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      ce.moveLevelDown();
      expect(ce.levels[0].meta.name).toBe("level2");
      expect(ce.levels[1].meta.name).toBe("level1");
      expect(ce.currentLevelIndex).toBe(1);
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      let rerendered = false;
      let changed = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.moveLevelDown();
      expect(rerendered).toBe(true);
      expect(changed).toBe(true);
    });
    test("should update hasChange", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      expect(ce.hasChange).toBe(false);
      ce.moveLevelDown();
      expect(ce.hasChange).toBe(true);
    });
  });
  describe("setCurrentLevelIndex", () => {
    test("should set current level index", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      ce.setCurrentLevelIndex(1);
      expect(ce.currentLevelIndex).toBe(1);
    });
    test("should not set invalid index", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      ce.setCurrentLevelIndex(-1);
      expect(ce.currentLevelIndex).toBe(0);
      ce.setCurrentLevelIndex(2);
      expect(ce.currentLevelIndex).toBe(0);
    });
    test("should trigger rerender event", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      let rerendered = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.setCurrentLevelIndex(1);
      expect(rerendered).toBe(true);
    });
  });
  describe("setChangePasswd", () => {
    test("should set changePasswd", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.setChangePasswd("newpass");
      expect(ce.changePasswd).toBe("newpass");
    });
    test("should set changePasswd to null if empty string is given", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.setChangePasswd("");
      expect(ce.changePasswd).toBeNull();
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      let rerendered = false;
      let changed = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.setChangePasswd("newpass");
      expect(rerendered).toBe(true);
      expect(changed).toBe(true);
    });
  });
  describe("setOffset", () => {
    test("should set offset and update level's current time", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.setOffset(0);
      expect(ce.offset).toBe(0); // 10 -> 0
      expect(ce.currentLevel!.current.timeSec).toBe(10); // 0 -> 10
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      let rerendered = false;
      let changed = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.setOffset(20);
      expect(rerendered).toBe(true);
      expect(changed).toBe(true);
    });
  });
  describe("setCurrentTimeWithoutOffset", () => {
    test("should set current time for all levels", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.setCurrentTimeWithoutOffset(30, 2);
      for (const level of ce.levels) {
        expect(level.current.timeSec).toBe(30 - ce.offset);
        expect(level.current.snapDivider).toBe(2);
      }
    });
    test("should keep old snapDivider if not given", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.levels[0].setCurrentTimeWithoutOffset(0, 4);
      ce.levels[1].setCurrentTimeWithoutOffset(0, 8);
      ce.setCurrentTimeWithoutOffset(30);
      expect(ce.levels[0].current.snapDivider).toBe(4);
      expect(ce.levels[1].current.snapDivider).toBe(8);
    });
  });
  describe("setYTDuration", () => {
    test("should set yt duration for all levels", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.setYTDuration(120);
      for (const level of ce.levels) {
        expect(level.ytDuration).toBe(120);
      }
    });
  });
  describe("copyNote, pasteNote, hasCopyBuf", () => {
    test("should copy, paste and check buffer", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      ce.currentLevel?.setCurrentTimeWithoutOffset(0 + ce.offset);
      expect(ce.hasCopyBuf(1)).toBe(false);

      expect(ce.currentLevel?.currentNote).not.toBeUndefined();
      ce.copyNote(1);
      expect(ce.hasCopyBuf(1)).toBe(true);

      ce.currentLevel?.setCurrentTimeWithoutOffset(1 + ce.offset);
      expect(ce.currentLevel?.current.noteIndex).toBe(1);
      expect(ce.currentLevel?.currentNote?.hitX).toEqual(
        dummyChartData.levels[0].notes[1].hitX
      );
      ce.pasteNote(1);
      expect(ce.currentLevel?.current.noteIndex).toBe(1);
      expect(ce.currentLevel?.currentNote?.hitX).toEqual(
        dummyChartData.levels[0].notes[0].hitX
      );
    });
  });
  describe("updateMeta", () => {
    test("should update meta", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.updateMeta({ title: "new title", composer: "new composer" });
      expect(ce.meta.title).toBe("new title");
      expect(ce.meta.composer).toBe("new composer");
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: { current: dummyLuaExecutor() },
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      let rerendered = false;
      let changed = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.updateMeta({ title: "new title" });
      expect(rerendered).toBe(true);
      expect(changed).toBe(true);
    });
  });
});
