import msgpack from "@ygoe/msgpack";
import {
  ChartEdit,
  currentChartVer,
  numEvents,
  validateChart,
  chartMaxEvent,
  fileMaxSize,
  rateLimitMin,
} from "@falling-nikochan/chart";
import { updateIpLastCreate } from "./dbRateLimit.js";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed, chartToEntry, zipEntry } from "./chart.js";
import { Hono } from "hono";
import { Bindings, secretSalt } from "../env.js";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import { getYTDataEntry } from "./ytData.js";

const newChartFileApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .get("/", async (c) => {
    console.log(c.req.header("x-forwarded-for"));
    return c.body(null, 400);
  })
  .post("/", async (c) => {
    console.log(c.req.header("x-forwarded-for"));
    const ip = String(
      c.req.header("x-forwarded-for")?.split(",").at(-1)?.trim(),
    ); // nullもundefinedも文字列にしちゃう
    const chartBuf = await c.req.arrayBuffer();
    const pSecretSalt = secretSalt(env(c));
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");

      if (
        !(env(c).API_ENV === "development" && env(c).API_NO_RATELIMIT) &&
        !(await updateIpLastCreate(db, ip))
      ) {
        return c.json(
          {
            message: "tooManyRequest",
            // message: `Too many requests, please retry ${rateLimitMin} minutes later`,
          },
          429,
          { "retry-after": (rateLimitMin * 60).toString() },
        );
      }

      if (chartBuf.byteLength > fileMaxSize) {
        throw new HTTPException(413, {
          message: "tooLargeFile",
          // message: `Chart too large (file size is ${chartBuf.byteLength} / ${fileMaxSize})`,
        });
      }

      const newChartObj = msgpack.deserialize(chartBuf);
      if (
        typeof newChartObj.ver === "number" &&
        newChartObj.ver < currentChartVer
      ) {
        throw new HTTPException(409, { message: "oldChartVersion" });
      }

      let newChart: ChartEdit;
      try {
        newChart = await validateChart(newChartObj);
      } catch (e) {
        console.error(e);
        throw new HTTPException(415, { message: (e as Error).toString() });
      }

      if (numEvents(newChart) > chartMaxEvent) {
        throw new HTTPException(413, {
          message: "tooManyEvent",
          // message: `Chart too large (number of events is ${numEvents(
          //   newChart
          // )} / ${chartMaxEvent})`,
        });
      }

      // update Time
      const updatedAt = new Date().getTime();

      let cid: string;
      while (true) {
        // 生成するcidは110000〜999999まで
        // 10xxxxはテストデータに使用するので、誤ってテストを本番環境で実行する可能性に備えて予約
        cid = Math.floor(Math.random() * 890000 + 110000).toString();
        if (
          await db
            .collection<ChartEntryCompressed>("chart")
            .countDocuments({ cid }, { limit: 1 })
        ) {
          // cidかぶり
          continue;
        } else {
          break;
        }
      }

      await db
        .collection<ChartEntryCompressed>("chart")
        .insertOne(
          await zipEntry(
            await chartToEntry(
              newChart,
              cid,
              updatedAt,
              ip,
              await getYTDataEntry(env(c), db, newChart.ytId),
              pSecretSalt,
              null,
            ),
          ),
        );

      return c.json({ cid: cid });
    } finally {
      await client.close();
    }
  });

export default newChartFileApp;
