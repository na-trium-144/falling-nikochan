import { MongoClient } from "mongodb";
import { chartToEntry, zipEntry } from "@falling-nikochan/route/src/api/chart";
import {
  Chart4,
  Chart5,
  Chart6,
  Chart7,
  ChartEdit,
  currentChartVer,
  Level6Play,
  Level8Play,
  stepZero,
} from "@falling-nikochan/chart";

export const dummyCid = "100000";
export const dummyDate = new Date(2025, 0, 1);
export function dummyChart(): ChartEdit {
  return {
    falling: "nikochan",
    ver: currentChartVer,
    offset: 1.23,
    ytId: "123456789ab",
    title: "a",
    composer: "b",
    chartCreator: "c",
    locale: "d",
    editPasswd: "p",
    published: false,
    levels: [
      {
        name: "e",
        type: "Single",
        unlisted: false,
        lua: ["g"],
        notes: [
          {
            step: stepZero(),
            big: false,
            hitX: 0,
            hitVX: 0,
            hitVY: 0,
            fall: true,
            luaLine: null,
          },
        ],
        rest: [{ begin: stepZero(), duration: stepZero(), luaLine: null }],
        bpmChanges: [
          { step: stepZero(), timeSec: 0, bpm: 180, luaLine: null },
          {
            step: { fourth: 1, numerator: 0, denominator: 1 },
            timeSec: 60 / 180,
            bpm: 120,
            luaLine: null,
          },
        ],
        speedChanges: [
          { step: stepZero(), timeSec: 0, bpm: 240, luaLine: null },
        ],
        signature: [
          {
            step: stepZero(),
            offset: stepZero(),
            barNum: 0,
            bars: [[4]],
            luaLine: null,
          },
        ],
      },
    ],
  };
}
export function dummyChart7(): Chart7 {
  return { ...dummyChart(), ver: 7 };
}
export function dummyChart6(): Chart6 {
  const c: Chart6 = { ...dummyChart(), ver: 6 };
  // @ts-expect-error converting Chart8 to 6
  delete c.locale;
  return c;
}
export function dummyChart5(): Chart5 {
  const c: Chart5 = {
    ...dummyChart6(),
    ver: 5,
    updatedAt: dummyDate.getTime(),
    levels: dummyChart().levels.map((l) => ({ ...l, hash: "" })),
  };
  return c;
}
export function dummyChart4(): Chart4 {
  return {
    ...dummyChart5(),
    ver: 4,
  };
}

export function dummyLevel8(): Level8Play {
  return {
    ver: 8,
    offset: 1.23,
    notes: [
      {
        step: stepZero(),
        big: false,
        hitX: 0,
        hitVX: 0,
        hitVY: 0,
        fall: true,
      },
    ],
    bpmChanges: [
      { step: stepZero(), timeSec: 0, bpm: 180 },
      {
        step: { fourth: 1, numerator: 0, denominator: 1 },
        timeSec: 60 / 180,
        bpm: 120,
      },
    ],
    speedChanges: [{ step: stepZero(), timeSec: 0, bpm: 240 }],
    signature: [
      {
        step: stepZero(),
        offset: stepZero(),
        barNum: 0,
        bars: [[4]],
      },
    ],
  };
}

export function dummyLevel6(): Level6Play {
  return {
    ver: 6,
    name: "e",
    type: "Single",
    offset: 1.23,
    notes: [
      {
        step: stepZero(),
        big: false,
        hitX: 0,
        hitVX: 0,
        hitVY: 0,
        luaLine: null,
      },
    ],
    rest: [{ begin: stepZero(), duration: stepZero(), luaLine: null }],
    bpmChanges: [
      { step: stepZero(), timeSec: 0, bpm: 180, luaLine: null },
      {
        step: { fourth: 1, numerator: 0, denominator: 1 },
        timeSec: 60 / 180,
        bpm: 120,
        luaLine: null,
      },
    ],
    speedChanges: [{ step: stepZero(), timeSec: 0, bpm: 240, luaLine: null }],
    signature: [
      {
        step: stepZero(),
        offset: stepZero(),
        barNum: 0,
        bars: [[4]],
        luaLine: null,
      },
    ],
    lua: ["g"],
    unlisted: false,
  };
}

/*
cid100000に最新バージョンのchart(dummyChart()参照)を、
100004〜100007にそれぞれver4〜7のchartを保存する
*/
export async function initDb() {
  if (typeof process.env.MONGODB_URI !== "string") {
    throw new Error("MONGODB_URI is not set");
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    await db.collection("rateLimit").deleteMany({});
    await db.collection("chart").updateOne(
      { cid: dummyCid },
      {
        $set: await zipEntry(
          await chartToEntry(dummyChart(), dummyCid, dummyDate.getTime())
        ),
      },
      { upsert: true }
    );
    await db.collection("chart").updateOne(
      { cid: String(Number(dummyCid) + 4) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            dummyChart(),
            String(Number(dummyCid) + 4),
            dummyDate.getTime()
          )),
          ver: 4,
          levels: dummyChart4().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection("chart").updateOne(
      { cid: String(Number(dummyCid) + 5) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            dummyChart(),
            String(Number(dummyCid) + 5),
            dummyDate.getTime()
          )),
          ver: 5,
          levels: dummyChart5().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection("chart").updateOne(
      { cid: String(Number(dummyCid) + 6) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            dummyChart(),
            String(Number(dummyCid) + 6),
            dummyDate.getTime()
          )),
          ver: 6,
          levels: dummyChart6().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection("chart").updateOne(
      { cid: String(Number(dummyCid) + 7) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            dummyChart(),
            String(Number(dummyCid) + 7),
            dummyDate.getTime()
          )),
          ver: 7,
          levels: dummyChart7().levels,
        }),
      },
      { upsert: true }
    );
  } finally {
    await client.close();
  }
}
