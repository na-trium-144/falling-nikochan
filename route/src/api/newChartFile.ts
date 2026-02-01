import msgpack from "@ygoe/msgpack";
import {
  ChartEdit,
  currentChartVer,
  numEvents,
  validateChart,
  chartMaxEvent,
  fileMaxSize,
  rateLimit,
  CidSchema,
  ChartEditSchema13,
  Chart13Edit,
  validateChart13,
} from "@falling-nikochan/chart";
import { getIp, updateIp } from "./dbRateLimit.js";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed, chartToEntry, zipEntry } from "./chart.js";
import { Context, Hono } from "hono";
import { Bindings, secretSalt } from "../env.js";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import { getYTDataEntry } from "./ytData.js";
import { describeRoute, resolver } from "hono-openapi";
import { errorLiteral } from "../error.js";
import * as v from "valibot";
import { ConnInfo } from "hono/conninfo";

const newChartFileApp = async (config: {
  getConnInfo: (c: Context) => ConnInfo | null;
}) =>
  new Hono<{ Bindings: Bindings }>({ strict: false })
    .get("/", async (c) => {
      console.log(getIp(c, config.getConnInfo));
      return c.body(null, 400);
    })
    .post(
      "/",
      describeRoute({
        description:
          "Create a new chart. " +
          "The chart data should be in MessagePack format, and " +
          `must be the latest format (Chart${currentChartVer}Edit) or one version earlier. ` +
          "Returns the chart ID (cid) of the newly created chart. " +
          `This endpoint is rate limited to one request per ${rateLimit.newChartFile / 60} minutes. `,
        requestBody: {
          description:
            "Chart data in MessagePack format. See also response type of GET /api/chartFile.",
          required: true,
          content: {
            "application/vnd.msgpack": {
              schema: ChartEditSchema13(),
            },
          },
        },
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: resolver(v.object({ cid: CidSchema() })),
              },
            },
          },
          409: {
            description: `chart version is older than ${currentChartVer - 1}`,
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("oldChartVersion")),
              },
            },
          },
          413: {
            description: "Chart file too large",
            content: {
              "application/json": {
                schema: resolver(
                  await errorLiteral("tooLargeFile", "tooManyEvent")
                ),
              },
            },
          },
          415: {
            description: "Invalid chart format",
            content: {
              "application/json": {
                schema: resolver(v.object({ message: v.string() })),
              },
            },
          },
          429: {
            description: "Rate limited",
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("tooManyRequest")),
              },
            },
            // headers: {
            //   "retry-after": {
            //     description: `Number of seconds to wait before retrying (approximately ${rateLimitMin} minutes)`,
            //     schema: { type: "string", format: "int32" },
            //   },
            // },
          },
        },
      }),
      async (c) => {
        const ip = getIp(c, config.getConnInfo);
        console.log(ip);
        const chartBuf = await c.req.arrayBuffer();
        const pSecretSalt = secretSalt(env(c));
        const client = new MongoClient(env(c).MONGODB_URI);
        try {
          await client.connect();
          const db = client.db("nikochan");

          if (!(await updateIp(env(c), db, ip, "newChartFile"))) {
            return c.json(
              {
                message: "tooManyRequest",
                // message: `Too many requests, please retry ${rateLimitMin} minutes later`,
              },
              429,
              { "retry-after": rateLimit.newChartFile.toString() }
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
            newChartObj.ver < currentChartVer - 1
          ) {
            throw new HTTPException(409, { message: "oldChartVersion" });
          }

          let newChart: Chart13Edit | ChartEdit;
          try {
            if (newChartObj.ver === currentChartVer - 1) {
              newChart = await validateChart13(newChartObj);
            } else {
              newChart = await validateChart(newChartObj);
            }
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
                  null
                )
              )
            );

          return c.json({ cid: cid });
        } finally {
          await client.close();
        }
      }
    );

export default newChartFileApp;
