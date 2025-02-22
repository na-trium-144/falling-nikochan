import { Hono } from "hono";
import msgpack from "@ygoe/msgpack";
import {
  ChartEdit,
  currentChartVer,
  hashLevel,
  numEvents,
  validateChart,
} from "../../chartFormat/chart.js";
import { chartMaxEvent, fileMaxSize } from "../../chartFormat/apiConfig.js";
import { MongoClient } from "mongodb";
import { chartToEntry, getChartEntry, zipEntry } from "./chart.js";
import { Bindings } from "../env.js";
import { env } from "hono/adapter";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

/**
 *
 * v6まで /api/chartFile/cid?p=(sha256 of passwd) の形式で、
 * sha256をそのままlocalStorageに保存していたのでlocalStorageを読めばアクセスできてしまう状態だった
 *
 * v7以降は直接アクセスするための /api/chartFile/cid?pw=(base64 of passwd) と、
 * localStorageに保存できるハッシュ済みのtokenを使った /api/chartFile/cid?ph=(sha256 of cid + passwd + cookie)
 * の2つの方法を用意する
 * cookieは /api/hashPasswd でランダムにセットされる
 *
 * また、development環境に限り /api/chartFile/cid?pbypass=1 でスキップできる
 */
const chartFileApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .get("/:cid", async (c) => {
    const cid = c.req.param("cid");
    const v6PasswdHash = c.req.query("p");
    const rawPasswd = c.req.query("pw");
    const v7PasswdHash = c.req.query("ph");
    let v7HashKey: string;
    if (env(c).API_ENV === "development") {
      v7HashKey = getCookie(c, "hashKey") || "";
    } else {
      v7HashKey = getCookie(c, "hashKey", "host") || "";
    }
    const bypass =
      c.req.query("pbypass") === "1" && env(c).API_ENV === "development";
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      let { chart } = await getChartEntry(db, cid, {
        bypass,
        v6PasswdHash,
        rawPasswd,
        v7PasswdHash,
        v7HashKey,
      });
      return c.body(new Blob([msgpack.serialize(chart)]).stream());
    } finally {
      await client.close();
    }
  })
  .post("/:cid", async (c) => {
    const cid = c.req.param("cid");
    const v6PasswdHash = c.req.query("p");
    const rawPasswd = c.req.query("pw");
    const v7PasswdHash = c.req.query("ph");
    let v7HashKey: string;
    if (env(c).API_ENV === "development") {
      v7HashKey = getCookie(c, "hashKey") || "";
    } else {
      v7HashKey = getCookie(c, "hashKey", "host") || "";
    }
    console.log(v7PasswdHash, v7HashKey);
    const bypass =
      c.req.query("pbypass") === "1" && env(c).API_ENV === "development";
    const chartBuf = await c.req.arrayBuffer();
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const { entry } = await getChartEntry(db, cid, {
        bypass,
        v6PasswdHash,
        rawPasswd,
        v7PasswdHash,
        v7HashKey,
      });

      if (chartBuf.byteLength > fileMaxSize) {
        throw new HTTPException(413, {
          message:
            `Chart too large (file size is ${chartBuf.byteLength} / ${fileMaxSize})`,
        });
      }

      const newChartObj = msgpack.deserialize(chartBuf);
      if (
        typeof newChartObj.ver === "number" &&
        newChartObj.ver < currentChartVer
      ) {
        throw new HTTPException(409, { message: "chart version is old" });
      }

      let newChart: ChartEdit;
      try {
        newChart = await validateChart(newChartObj);
      } catch (e) {
        console.error(e);
        throw new HTTPException(415, { message: "invalid chart data" });
      }

      if (numEvents(newChart) > chartMaxEvent) {
        throw new HTTPException(413,
          {
            message: `Chart too large (number of events is ${numEvents(
              newChart
            )} / ${chartMaxEvent})`,
          },
        );
      }

      // update Time
      const prevHashes = entry.levelBrief.map((l) => l.hash);
      const newHashes = await Promise.all(
        newChart.levels.map((level) => hashLevel(level))
      );
      let updatedAt = entry.updatedAt;
      if (!newHashes.every((h, i) => h === prevHashes[i])) {
        updatedAt = new Date().getTime();
      }
      // if (chart.published || newChart.published) {
      //   revalidateLatest();
      // }

      await db.collection("chart").updateOne(
        { cid },
        {
          $set: await zipEntry(
            await chartToEntry(newChart, cid, updatedAt, entry)
          ),
        }
      );
      // revalidateBrief(cid);
      return c.body(null, 204);
    } finally {
      await client.close();
    }
  })
  .delete("/:cid", async (c) => {
    const cid = c.req.param("cid");
    const v6PasswdHash = c.req.query("p");
    const rawPasswd = c.req.query("pw");
    const v7PasswdHash = c.req.query("ph");
    let v7HashKey: string;
    if (env(c).API_ENV === "development") {
      v7HashKey = getCookie(c, "hashKey") || "";
    } else {
      v7HashKey = getCookie(c, "hashKey", "host") || "";
    }
    const bypass =
      c.req.query("pbypass") === "1" && env(c).API_ENV === "development";
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      await getChartEntry(db, cid, {
        bypass,
        v6PasswdHash,
        rawPasswd,
        v7PasswdHash,
        v7HashKey,
      });

      await db.collection("chart").updateOne(
        { cid },
        {
          $set: {
            levelsCompressed: "",
            deleted: true,
          },
        }
      );
      // revalidateBrief(cid);
      // if (chart.published) {
      //   revalidateLatest();
      // }
      return c.body(null, 204);
    } finally {
      await client.close();
    }
  });

export default chartFileApp;
