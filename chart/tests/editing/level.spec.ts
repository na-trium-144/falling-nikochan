import { expect, test, describe, vi } from "vitest";
import {
  LevelEditing,
  dummyChartData,
  dummyLuaExecutor,
  stepZero,
  NoteCommand,
} from "@falling-nikochan/chart";

describe("LevelEditing", () => {
  const parentEmit = vi.fn();
  const offset = () => 0;
  const luaExecutorRef = { current: dummyLuaExecutor() };

  let level: LevelEditing;

  beforeEach(() => {
    level = new LevelEditing(
      dummyChartData.levels[0],
      parentEmit,
      offset,
      luaExecutorRef
    );
    parentEmit.mockClear();
  });

  test("constructor", () => {
    expect(level.meta.name).toBe("level1");
    expect(level.freeze.notes.length).toBe(3);
    expect(parentEmit).not.toHaveBeenCalled();
  });

  test("toObject", () => {
    const obj = level.toObject();
    expect(obj.name).toBe("level1");
    expect(obj.notes.length).toBe(3);
  });

  test("updateMeta", () => {
    level.updateMeta({ name: "new name" });
    expect(level.meta.name).toBe("new name");
    expect(parentEmit).toHaveBeenCalledWith("rerender");
    expect(parentEmit).toHaveBeenCalledWith("change");
  });

  test("updateFreeze", () => {
    const newNotes = [...level.freeze.notes, { ...level.freeze.notes[0] }];
    level.updateFreeze({ notes: newNotes });
    expect(level.freeze.notes.length).toBe(4);
    expect(parentEmit).toHaveBeenCalledWith("rerender");
    expect(parentEmit).toHaveBeenCalledWith("change");
  });

  test("setYTDuration", () => {
    level.setYTDuration(180);
    expect(level.ytDuration).toBe(180);
    expect(parentEmit).toHaveBeenCalledWith("rerender");
  });

  test("resetYTEnd", () => {
    level.updateMeta({ ytEnd: "note" });
    level.resetYTEnd();
    expect(level.meta.ytEndSec).toBe(level.lengthSec);

    level.updateMeta({ ytEnd: "yt" });
    level.setYTDuration(180);
    level.resetYTEnd();
    expect(level.meta.ytEndSec).toBe(180);

    level.updateMeta({ ytEnd: 100 });
    level.resetYTEnd();
    expect(level.meta.ytEndSec).toBe(100);
  });

  test("setCurrentTimeWithoutOffset", () => {
    level.setCurrentTimeWithoutOffset(1, 2);
    expect(level.current.timeSec).toBe(1);
    expect(level.current.snapDivider).toBe(2);
  });

  test("setSnapDivider", () => {
    level.setSnapDivider(4);
    expect(level.current.snapDivider).toBe(4);
  });

  test("selectNextNote and selectPrevNote", () => {
    level.setCurrentTimeWithoutOffset(1);
    expect(level.current.noteIndex).toBe(1);
    level.selectNextNote();
    // noteIndex is not changed because there is only one note at the step
    expect(level.current.noteIndex).toBe(1);

    level.setCurrentTimeWithoutOffset(0);
    level.selectPrevNote();
    // noteIndex is not changed because it is the first note
    expect(level.current.noteIndex).toBe(0);
  });

  test("addNote, deleteNote, updateNote", () => {
    const newNote: NoteCommand = { big: false, hitX: 0, hitVX: 0, hitVY: 0, fall: true, luaLine: 0 };
    
    // add
    level.setCurrentTimeWithoutOffset(2, 1);
    const initialNotesCount = level.freeze.notes.length;
    level.addNote(newNote);
    expect(level.freeze.notes.length).toBe(initialNotesCount + 1);

    // update
    level.updateNote({ ...newNote, big: true });
    expect(level.currentNote?.big).toBe(true);
    
    // delete
    level.deleteNote();
    expect(level.freeze.notes.length).toBe(initialNotesCount);
  });
});
