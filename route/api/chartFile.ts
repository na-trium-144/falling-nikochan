import { Hono } from "hono";
import msgpack from "@ygoe/msgpack";
import {
    ChartEdit,
  currentChartVer,
  hashLevel,
  validateChart,
} from "../../chartFormat/chart.js";
import { chartMaxSize } from "../../chartFormat/apiConfig.js";
import { MongoClient } from "mongodb";
import { chartToEntry, getChartEntry, zipEntry } from "./chart.js";
import { Bindings } from "../env.js";
import { env } from "hono/adapter";
import { getCookie } from "hono/cookie";

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
      let { res, chart } = await getChartEntry(db, cid, {
        bypass,
        v6PasswdHash,
        rawPasswd,
        v7PasswdHash,
        v7HashKey,
      });
      if (!chart) {
        return c.json({ message: res?.message }, res?.status || 500);
      }
      return c.body(new Blob([msgpack.serialize(chart)]).stream());
    } catch (e) {
      console.error(e);
      return c.body(null, 500);
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
      const { res, entry, chart } = await getChartEntry(db, cid, {
        bypass,
        v6PasswdHash,
        rawPasswd,
        v7PasswdHash,
        v7HashKey,
      });
      if (!chart || !entry) {
        return c.json({ message: res?.message }, res?.status || 500);
      }

      if (chartBuf.byteLength > chartMaxSize) {
        return c.json(
          {
            message:
              `Chart too large (${Math.round(chartBuf.byteLength / 1000)}kB),` +
              `Max ${Math.round(chartMaxSize / 1000)}kB`,
          },
          413
        );
      }

      const newChartObj = msgpack.deserialize(chartBuf);
      if (
        typeof newChartObj.ver === "number" &&
        newChartObj.ver < currentChartVer
      ) {
        return c.json({ message: "chart version is old" }, 409);
      }

      let newChart: ChartEdit;
      try {
        newChart = await validateChart(newChartObj);
      } catch (e) {
        console.error(e);
        return c.json({ message: "invalid chart data" }, 415);
      }

      // update Time
      const prevHashes = entry.levelBrief.map((l) => l.hash);
      const newHashes = await Promise.all(
        newChart.levelsFreezed.map((level) => hashLevel(level))
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
      return c.body(null);
    } catch (e) {
      console.error(e);
      return c.body(null, 500);
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
      const { res, chart } = await getChartEntry(db, cid, {
        bypass,
        v6PasswdHash,
        rawPasswd,
        v7PasswdHash,
        v7HashKey,
      });
      if (!chart) {
        return c.json({ message: res?.message }, res?.status || 500);
      }

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
      return c.body(null);
    } catch (e) {
      console.error(e);
      return c.body(null, 500);
    } finally {
      await client.close();
    }
  });

export default chartFileApp;
