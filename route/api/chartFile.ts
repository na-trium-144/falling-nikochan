import { Hono } from "hono";
import msgpack from "@ygoe/msgpack";
import {
  Chart,
  chartMaxSize,
  hashLevel,
  validateChart,
} from "@/chartFormat/chart";
import { MongoClient } from "mongodb";
import "dotenv/config";
import { chartToEntry, getChartEntry, zipEntry } from "./chart";
import { Bindings } from "../env";

// 他のAPIと違って編集用パスワードのチェックが入る
// クエリパラメータのpで渡す
const chartFileApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .get("/:cid", async (c) => {
    const cid = c.req.param("cid");
    const passwdHash = c.req.query("p");
    const client = new MongoClient(c.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      let { res, chart } = await getChartEntry(db, cid, passwdHash || "");
      if (!chart) {
        return c.json({ message: res?.message }, 500);
      }
      try {
        chart = await validateChart(chart);
      } catch (e) {
        return c.json({ message: "invalid chart data" }, 500);
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
    const passwdHash = c.req.query("p");
    const chartBuf = await c.req.arrayBuffer();
    const client = new MongoClient(c.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const { res, entry, chart } = await getChartEntry(
        db,
        cid,
        passwdHash || ""
      );
      if (!chart || !entry) {
        return c.json({ message: res?.message }, 500);
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

      let newChart: Chart;
      try {
        newChart = msgpack.deserialize(chartBuf);
        newChart = await validateChart(newChart);
      } catch (e) {
        console.error(e);
        return c.json({ message: "invalid chart data" }, 400);
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
    const passwdHash = c.req.query("p");
    const client = new MongoClient(c.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const { res, chart } = await getChartEntry(db, cid, passwdHash || "");
      if (!chart) {
        return c.json({ message: res?.message }, 500);
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
