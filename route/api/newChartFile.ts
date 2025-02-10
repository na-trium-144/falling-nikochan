import msgpack from "@ygoe/msgpack";
import {
  Chart,
  chartMaxSize,
  currentChartVer,
  validateChart,
} from "../../chartFormat/chart.js";
import { updateIpLastCreate } from "./dbRateLimit.js";
import { rateLimitMin } from "../../chartFormat/apiConfig.js";
import { MongoClient } from "mongodb";
import { chartToEntry, getChartEntry, zipEntry } from "./chart.js";
import { Hono } from "hono";
import { Bindings } from "../env.js";
import { env } from "hono/adapter";

const newChartFileApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .get("/", async (c) => {
    console.log(c.req.header("x-forwarded-for"));
    return c.body(null, 400);
  })
  .post("/", async (c) => {
    // cidとfidを生成し、bodyのデータを保存して、cidを返す
    console.log(c.req.header("x-forwarded-for"));
    const ip = String(
      c.req.header("x-forwarded-for")?.split(",").at(-1)?.trim()
    ); // nullもundefinedも文字列にしちゃう
    const chartBuf = await c.req.arrayBuffer();
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");

      if (
        env(c).API_ENV !== "development" &&
        !(await updateIpLastCreate(db, ip))
      ) {
        return c.json(
          {
            message: `Too many requests, please retry ${rateLimitMin} minutes later`,
          },
          429,
          { "retry-after": (rateLimitMin * 60).toString() }
        );
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

      let newChart: Chart;
      try {
        newChart = await validateChart(newChartObj);
      } catch (e) {
        console.error(e);
        return c.json({ message: "invalid chart data" }, 415);
      }

      // update Time
      const updatedAt = new Date().getTime();

      // if (chart.published) {
      //   revalidateLatest();
      // }

      let cid: string;
      while (true) {
        cid = Math.floor(Math.random() * 900000 + 100000).toString();
        const { entry } = await getChartEntry(db, cid, null);
        if (entry) {
          // cidかぶり
          continue;
        } else {
          break;
        }
      }

      await db
        .collection("chart")
        .insertOne(
          await zipEntry(await chartToEntry(newChart, cid, updatedAt))
        );
      // revalidateBrief(cid);

      return c.json({ cid: cid });
    } catch (e) {
      console.error(e);
      return c.body(null, 500);
    } finally {
      await client.close();
    }
  });

export default newChartFileApp;
