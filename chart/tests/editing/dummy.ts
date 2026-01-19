import {
  ChartEdit,
  currentChartVer,
  LevelFreeze,
  LuaExecutor,
  stepZero,
} from "@falling-nikochan/chart";

export function dummyLuaExecutor(
  exec: (code: string) => Promise<LevelFreeze | null> = async () => null,
  abortExec: () => void = () => undefined
): { current: LuaExecutor } {
  return {
    current: {
      stdout: [],
      err: [],
      errLine: null,
      running: false,
      exec,
      abortExec,
    },
  };
}
export const dummyChartData: ChartEdit = {
  falling: "nikochan",
  ver: currentChartVer,
  offset: 10,
  ytId: "123456789ab",
  title: "title",
  composer: "composer",
  chartCreator: "chartCreator",
  locale: "ja",
  changePasswd: null,
  published: false,
  levels: [
    {
      name: "level1",
      type: "Single",
      unlisted: false,
      lua: [],
      ytBegin: 10,
      ytEnd: 20,
      ytEndSec: 20,
      notes: [
        {
          step: stepZero(),
          big: false,
          hitX: -3,
          hitVX: 1,
          hitVY: 3,
          fall: true,
          luaLine: 0,
        },
        {
          step: { fourth: 1, numerator: 0, denominator: 1 },
          big: false,
          hitX: -2,
          hitVX: 1,
          hitVY: 3,
          fall: true,
          luaLine: 1,
        },
        {
          step: { fourth: 1, numerator: 0, denominator: 1 },
          big: false,
          hitX: 0,
          hitVX: 1,
          hitVY: 3,
          fall: true,
          luaLine: 1,
        },
        {
          step: { fourth: 3, numerator: 0, denominator: 1 },
          big: false,
          hitX: -1,
          hitVX: 1,
          hitVY: 3,
          fall: true,
          luaLine: null,
        },
      ],
      rest: [
        {
          begin: stepZero(),
          duration: { fourth: 1, numerator: 0, denominator: 1 },
          luaLine: 0,
        },
        {
          begin: { fourth: 1, numerator: 0, denominator: 1 },
          duration: { fourth: 1, numerator: 0, denominator: 1 },
          luaLine: 0,
        },
      ],
      bpmChanges: [
        { step: stepZero(), bpm: 60, timeSec: 0, luaLine: 0 },
        {
          step: { fourth: 1, numerator: 0, denominator: 1 },
          bpm: 120,
          timeSec: 1,
          luaLine: 0,
        },
        {
          step: { fourth: 3, numerator: 0, denominator: 1 },
          bpm: 120,
          timeSec: 2,
          luaLine: null,
        },
      ],
      speedChanges: [
        { step: stepZero(), bpm: 60, timeSec: 0, luaLine: 0, interp: false },
        {
          step: { fourth: 1, numerator: 0, denominator: 1 },
          bpm: 60,
          timeSec: 1,
          luaLine: 0,
          interp: false,
        },
        {
          step: { fourth: 3, numerator: 0, denominator: 1 },
          bpm: 120,
          timeSec: 2,
          luaLine: 0,
          interp: true,
        },
      ],
      signature: [
        {
          step: stepZero(),
          offset: stepZero(),
          barNum: 0,
          bars: [[4]],
          luaLine: 0,
        },
        {
          step: { fourth: 1, numerator: 0, denominator: 1 },
          offset: stepZero(),
          barNum: 1,
          bars: [[4, 4]],
          luaLine: 0,
        },
      ],
    },
    {
      name: "level2",
      type: "Double",
      unlisted: true,
      ytBegin: 30,
      ytEnd: 40,
      ytEndSec: 40,
      lua: [],
      notes: [],
      rest: [],
      bpmChanges: [{ step: stepZero(), bpm: 60, timeSec: 0, luaLine: 0 }],
      speedChanges: [
        { step: stepZero(), bpm: 60, timeSec: 0, luaLine: 0, interp: false },
      ],
      signature: [
        {
          step: stepZero(),
          offset: stepZero(),
          barNum: 0,
          bars: [[4]],
          luaLine: 0,
        },
      ],
    },
  ],
  copyBuffer: Array.from(new Array(10)).map(() => null),
};
