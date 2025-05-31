import { MongoClient } from "mongodb";
import {
  ChartEntryCompressed,
  chartToEntry,
  zipEntry,
} from "@falling-nikochan/route/src/api/chart";
import { PlayRecordEntry } from "@falling-nikochan/route/src/api/record";
import {
  Chart11Edit,
  Chart4,
  Chart5,
  Chart6,
  Chart7,
  Chart8Edit,
  Chart9Edit,
  currentChartVer,
  defaultCopyBuffer,
  Level11Play,
  Level6Play,
  stepZero,
} from "@falling-nikochan/chart";
import { Hono } from "hono";
import {
  apiApp,
  shareApp,
  redirectApp,
  Bindings,
  notFound,
  onError,
  languageDetector,
  fetchStatic,
  fetchBrief,
} from "@falling-nikochan/route";

export const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .route("/api", apiApp)
  .route(
    "/share",
    shareApp({
      fetchBrief: fetchBrief({ fetchStatic }),
      fetchStatic,
    })
  )
  .route("/", redirectApp({ fetchStatic }))
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

export const dummyCid = "100000";
export const dummyDate = new Date(2025, 0, 1);
export function dummyChart(): Chart11Edit {
  return {
    falling: "nikochan",
    ver: currentChartVer,
    offset: 1.23,
    ytId: "123456789ab",
    title: "test テスト",
    composer: "b",
    chartCreator: "c",
    locale: "d",
    changePasswd: null,
    published: false,
    copyBuffer: defaultCopyBuffer(),
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
        ytBegin: 0,
        ytEnd: "note",
        ytEndSec: 1.23, // offset がたされている
      },
    ],
  };
}
export function dummyChart11(): Chart11Edit {
  return { ...dummyChart(), ver: 11 };
}
export function dummyChart10(): Chart9Edit {
  const c: Chart9Edit = {
    ...dummyChart(),
    ver: 10,
    levels: dummyChart().levels.map((l) => ({
      name: l.name,
      type: l.type,
      unlisted: l.unlisted,
      lua: l.lua,
      notes: l.notes,
      rest: l.rest,
      bpmChanges: l.bpmChanges,
      speedChanges: l.speedChanges,
      signature: l.signature,
    })),
  };
  // @ts-expect-error converting Chart11 to 10
  delete c.copyBuffer;
  return c;
}
export function dummyChart9(): Chart9Edit {
  return { ...dummyChart10(), ver: 9 };
}
export function dummyChart8(): Chart8Edit {
  const c: Chart8Edit = { ...dummyChart10(), ver: 8, editPasswd: "" };
  // @ts-expect-error converting Chart9 to 8
  delete c.changePasswd;
  return c;
}
export function dummyChart7(): Chart7 {
  return { ...dummyChart8(), ver: 7 };
}
export function dummyChart6(): Chart6 {
  const c: Chart6 = { ...dummyChart7(), ver: 6 };
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

export function dummyLevel11(): Level11Play {
  return {
    ver: 12,
    offset: 1.23,
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
    ytBegin: 0,
    ytEnd: "note",
    ytEndSec: 1.23,
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
100004〜100009にそれぞれver4〜9のchartを保存する
*/
export async function initDb() {
  if (typeof process.env.MONGODB_URI !== "string") {
    throw new Error("MONGODB_URI is not set");
  }
  const pSecretSalt = process.env.SECRET_SALT || "SecretSalt";
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    await db.collection("rateLimit").deleteMany({});
    await db.collection<PlayRecordEntry>("playRecord").deleteMany({});
    await db.collection<PlayRecordEntry>("playRecord").insertOne({
      cid: dummyCid,
      lvHash: "dummy",
      playedAt: Date.now(),
      auto: false,
      score: 100,
      fc: true,
      fb: false,
      factor: 0.7,
      editing: false,
    });
    await db.collection<PlayRecordEntry>("playRecord").insertOne({
      cid: dummyCid,
      lvHash: "dummy",
      playedAt: Date.now(),
      auto: false,
      score: 100,
      fc: true,
      fb: false,
      factor: 0.1,
      editing: false,
    });
    await db.collection<PlayRecordEntry>("playRecord").insertOne({
      cid: dummyCid,
      lvHash: "dummy",
      playedAt: Date.now(),
      auto: false,
      score: 50,
      fc: false,
      fb: false,
      factor: 0.5,
      editing: false,
    });
    await db.collection<PlayRecordEntry>("playRecord").insertOne({
      cid: dummyCid,
      lvHash: "dummy",
      playedAt: Date.now(),
      auto: true,
      score: 50,
      fc: false,
      fb: false,
      factor: 1,
      editing: false,
    });
    await db.collection<PlayRecordEntry>("playRecord").insertOne({
      cid: dummyCid,
      lvHash: "dummy",
      playedAt: Date.now(),
      auto: false,
      score: 30,
      fc: false,
      fb: false,
      factor: 1,
      editing: true,
    });
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: dummyCid },
      {
        $set: await zipEntry(
          await chartToEntry(
            { ...dummyChart(), changePasswd: "p", published: true },
            dummyCid,
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )
        ),
      },
      { upsert: true }
    );
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: dummyCid + 1 },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...dummyChart(),
              changePasswd: "p",
              published: true,
            },
            dummyCid,
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
          deleted: true,
        }),
      },
      { upsert: true }
    );
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: String(Number(dummyCid) + 4) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...dummyChart(),
              changePasswd: "p",
            },
            String(Number(dummyCid) + 4),
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
          ver: 4,
          levels: dummyChart4().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: String(Number(dummyCid) + 5) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...dummyChart(),
              changePasswd: "p",
            },
            String(Number(dummyCid) + 5),
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
          ver: 5,
          levels: dummyChart5().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: String(Number(dummyCid) + 6) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...dummyChart(),
              changePasswd: "p",
            },
            String(Number(dummyCid) + 6),
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
          ver: 6,
          levels: dummyChart6().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: String(Number(dummyCid) + 7) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...dummyChart(),
              changePasswd: "p",
            },
            String(Number(dummyCid) + 7),
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
          ver: 7,
          levels: dummyChart7().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: String(Number(dummyCid) + 8) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...dummyChart(),
              changePasswd: "p",
            },
            String(Number(dummyCid) + 8),
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
          ver: 8,
          levels: dummyChart8().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: String(Number(dummyCid) + 9) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...dummyChart(),
              changePasswd: "p",
            },
            String(Number(dummyCid) + 9),
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
          ver: 9,
          levels: dummyChart9().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: String(Number(dummyCid) + 10) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...dummyChart(),
              changePasswd: "p",
            },
            String(Number(dummyCid) + 10),
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
          ver: 10,
          levels: dummyChart10().levels,
        }),
      },
      { upsert: true }
    );
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: String(Number(dummyCid) + 11) },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...dummyChart11(),
              changePasswd: "p",
            },
            String(Number(dummyCid) + 11),
            dummyDate.getTime(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
          ver: 11,
          levels: dummyChart11().levels,
        }),
      },
      { upsert: true }
    );
  } finally {
    await client.close();
  }
}
