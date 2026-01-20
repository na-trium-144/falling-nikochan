import { test, describe } from "node:test";
import { expect } from "chai";
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
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: "123456",
        currentPasswd: "passwd",
        convertedFrom: 5,
        currentLevelIndex: 1,
        hasChange: true,
      });
      expect(ce.convertedFrom).to.equal(5);
      expect(ce.cid).to.equal("123456");
      expect(ce.currentPasswd).to.equal("passwd");
      // expect(ce.locale).to.equal("en");
      expect(ce.hasChange).to.equal(true);
      expect(ce.currentLevelIndex).to.equal(1);
    });
    test("default values for options", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      expect(ce.convertedFrom).to.equal(currentChartVer);
      expect(ce.hasChange).to.equal(false);
      expect(ce.currentLevelIndex).to.equal(0);
    });
    test("should calculate numEvents", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      expect(ce.numEvents).to.equal(numEvents(dummyChartData));
    });
    test("should propagate rerender and change event from levels", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
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
      expect(rerendered).to.equal(true);
      ce.levels[0].emit("change");
      expect(changed).to.equal(true);
    });
  });
  describe("resetOnSave", () => {
    test("should reset convertedFrom", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        convertedFrom: 1,
      });
      expect(ce.convertedFrom).to.equal(1);
      ce.resetOnSave("1");
      expect(ce.convertedFrom).to.equal(currentChartVer);
    });
    test("should reset hasChange", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        hasChange: true,
      });
      expect(ce.hasChange).to.equal(true);
      ce.resetOnSave("1");
      expect(ce.hasChange).to.equal(false);
    });
    test("should move changePasswd to currentPasswd", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: "oldpass",
      });
      ce.setChangePasswd("newpass");
      expect(ce.currentPasswd).to.equal("oldpass");
      expect(ce.changePasswd).to.equal("newpass");
      ce.resetOnSave("1");
      expect(ce.currentPasswd).to.equal("newpass");
      expect(ce.changePasswd).to.be.null;
    });
    test("should keep currentPasswd if changePasswd is null", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: "oldpass",
      });
      expect(ce.currentPasswd).to.equal("oldpass");
      expect(ce.changePasswd).to.be.null;
      ce.resetOnSave("1");
      expect(ce.currentPasswd).to.equal("oldpass");
      expect(ce.changePasswd).to.be.null;
    });
    test("should set cid", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      expect(ce.cid).to.be.undefined;
      ce.resetOnSave("123");
      expect(ce.cid).to.equal("123");
    });
    test("should emit rerender event", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      let rerendered = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.resetOnSave("1");
      expect(rerendered).to.equal(true);
    });
  });
  test("toObject", () => {
    const ce = new ChartEditing(dummyChartData, {
      luaExecutorRef: dummyLuaExecutor(),
      locale: "en",
      cid: undefined,
      currentPasswd: null,
    });
    const obj = ce.toObject();
    expect(obj).to.deep.equal({ ...dummyChartData, locale: "en" });
  });
  test("toMin", () => {
    const ce = new ChartEditing(dummyChartData, {
      luaExecutorRef: dummyLuaExecutor(),
      locale: "en",
      cid: undefined,
      currentPasswd: null,
    });
    const min = ce.toMin();
    expect(min).to.deep.equal({
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
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      const newLevel = emptyLevel();
      newLevel.name = "New Level";
      ce.addLevel(newLevel);
      expect(ce.levels.length).to.equal(3);
      expect(ce.levels[1].meta.name).to.equal("New Level");
      expect(ce.currentLevelIndex).to.equal(1);
    });
    test("should trigger rerender, change and levelIndex events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      let rerendered = false;
      let changed = false;
      let levelIndexChanged = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.on("levelIndex", () => {
        levelIndexChanged = true;
      });
      ce.addLevel(emptyLevel());
      expect(rerendered).to.equal(true);
      expect(changed).to.equal(true);
      expect(levelIndexChanged).to.equal(true);
    });
    test("should update hasChange and numEvents", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      expect(ce.hasChange).to.equal(false);
      ce.addLevel(emptyLevel());
      expect(ce.hasChange).to.equal(true);
      expect(ce.numEvents).to.be.above(numEvents(dummyChartData));
    });
  });
  describe("deleteLevel", () => {
    test("should delete the current level", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      ce.deleteLevel();
      expect(ce.levels.length).to.equal(1);
      expect(ce.currentLevelIndex).to.equal(0);
      expect(ce.levels[0].meta.name).to.equal("level1");
    });
    test("should trigger rerender, change and levelIndex events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      let rerendered = false;
      let changed = false;
      let levelIndexChanged = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.on("levelIndex", () => {
        levelIndexChanged = true;
      });
      ce.deleteLevel();
      expect(rerendered).to.equal(true);
      expect(changed).to.equal(true);
      expect(levelIndexChanged).to.equal(true);
    });
    test("should update hasChange and numEvents", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      expect(ce.hasChange).to.equal(false);
      ce.deleteLevel();
      expect(ce.hasChange).to.equal(true);
      expect(ce.numEvents).to.be.below(numEvents(dummyChartData));
    });
  });
  describe("moveLevelUp", () => {
    test("should move the current level up", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      ce.moveLevelUp();
      expect(ce.levels[0].meta.name).to.equal("level2");
      expect(ce.levels[1].meta.name).to.equal("level1");
      expect(ce.currentLevelIndex).to.equal(0);
    });
    test("should trigger rerender, change and levelIndex events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      let rerendered = false;
      let changed = false;
      let levelIndexChanged = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.on("levelIndex", () => {
        levelIndexChanged = true;
      });
      ce.moveLevelUp();
      expect(rerendered).to.equal(true);
      expect(changed).to.equal(true);
      expect(levelIndexChanged).to.equal(true);
    });
    test("should update hasChange", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 1,
      });
      expect(ce.hasChange).to.equal(false);
      ce.moveLevelUp();
      expect(ce.hasChange).to.equal(true);
    });
  });
  describe("moveLevelDown", () => {
    test("should move the current level down", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      ce.moveLevelDown();
      expect(ce.levels[0].meta.name).to.equal("level2");
      expect(ce.levels[1].meta.name).to.equal("level1");
      expect(ce.currentLevelIndex).to.equal(1);
    });
    test("should trigger rerender, change and levelIndex events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      let rerendered = false;
      let changed = false;
      let levelIndexChanged = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("change", () => {
        changed = true;
      });
      ce.on("levelIndex", () => {
        levelIndexChanged = true;
      });
      ce.moveLevelDown();
      expect(rerendered).to.equal(true);
      expect(changed).to.equal(true);
      expect(levelIndexChanged).to.equal(true);
    });
    test("should update hasChange", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      expect(ce.hasChange).to.equal(false);
      ce.moveLevelDown();
      expect(ce.hasChange).to.equal(true);
    });
  });
  describe("setCurrentLevelIndex", () => {
    test("should set current level index", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      ce.setCurrentLevelIndex(1);
      expect(ce.currentLevelIndex).to.equal(1);
    });
    test("should not set invalid index", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      ce.setCurrentLevelIndex(-1);
      expect(ce.currentLevelIndex).to.equal(0);
      ce.setCurrentLevelIndex(2);
      expect(ce.currentLevelIndex).to.equal(0);
    });
    test("should trigger rerender and levelIndex event", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      let rerendered = false;
      let levelIndexChanged = false;
      ce.on("rerender", () => {
        rerendered = true;
      });
      ce.on("levelIndex", () => {
        levelIndexChanged = true;
      });
      ce.setCurrentLevelIndex(1);
      expect(rerendered).to.equal(true);
      expect(levelIndexChanged).to.equal(true);
    });
  });
  describe("setChangePasswd", () => {
    test("should set changePasswd", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.setChangePasswd("newpass");
      expect(ce.changePasswd).to.equal("newpass");
    });
    test("should set changePasswd to null if empty string is given", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.setChangePasswd("");
      expect(ce.changePasswd).to.be.null;
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
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
      expect(rerendered).to.equal(true);
      expect(changed).to.equal(true);
    });
  });
  describe("setOffset", () => {
    test("should set offset and update level's current time", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      expect(ce.currentLevel!.current.timeSec).to.equal(-10);
      ce.setOffset(0);
      expect(ce.offset).to.equal(0); // 10 -> 0
      expect(ce.currentLevel!.current.timeSec).to.equal(0); // -10 -> 0
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
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
      expect(rerendered).to.equal(true);
      expect(changed).to.equal(true);
    });
  });
  describe("setCurrentTimeWithoutOffset", () => {
    test("should set current time for all levels", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.setCurrentTimeWithoutOffset(30, 2);
      for (const level of ce.levels) {
        expect(level.current.timeSec).to.equal(30 - ce.offset);
        expect(level.current.snapDivider).to.equal(2);
      }
    });
    test("should keep old snapDivider if not given", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.levels[0].setCurrentTimeWithoutOffset(0, 4);
      ce.levels[1].setCurrentTimeWithoutOffset(0, 8);
      ce.setCurrentTimeWithoutOffset(30);
      expect(ce.levels[0].current.snapDivider).to.equal(4);
      expect(ce.levels[1].current.snapDivider).to.equal(8);
    });
  });
  describe("setYTDuration", () => {
    test("should set yt duration for all levels", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.setYTDuration(120);
      for (const level of ce.levels) {
        expect(level.ytDuration).to.equal(120);
      }
    });
  });
  describe("copyNote, pasteNote, hasCopyBuf", () => {
    test("should copy, paste and check buffer", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
        currentLevelIndex: 0,
      });
      ce.currentLevel?.setCurrentTimeWithoutOffset(0 + ce.offset);
      expect(ce.hasCopyBuf(1)).to.equal(false);

      expect(ce.currentLevel?.currentNote).not.to.be.undefined;
      ce.copyNote(1);
      expect(ce.hasCopyBuf(1)).to.equal(true);

      ce.currentLevel?.setCurrentTimeWithoutOffset(1 + ce.offset);
      expect(ce.currentLevel?.current.noteIndex).to.equal(1);
      expect(ce.currentLevel?.currentNote?.hitX).to.deep.equal(
        dummyChartData.levels[0].notes[1].hitX
      );
      ce.pasteNote(1);
      expect(ce.currentLevel?.current.noteIndex).to.equal(1);
      expect(ce.currentLevel?.currentNote?.hitX).to.deep.equal(
        dummyChartData.levels[0].notes[0].hitX
      );
    });
  });
  describe("updateMeta", () => {
    test("should update meta", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
        locale: "en",
        cid: undefined,
        currentPasswd: null,
      });
      ce.updateMeta({ title: "new title", composer: "new composer" });
      expect(ce.meta.title).to.equal("new title");
      expect(ce.meta.composer).to.equal("new composer");
    });
    test("should trigger rerender and change events", () => {
      const ce = new ChartEditing(dummyChartData, {
        luaExecutorRef: dummyLuaExecutor(),
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
      expect(rerendered).to.equal(true);
      expect(changed).to.equal(true);
    });
  });
});
