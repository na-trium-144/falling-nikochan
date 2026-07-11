import * as msgpack from "@msgpack/msgpack";
import {
  currentChartVer,
  numEvents,
  validateChartWithoutConvert,
  chartMaxEvent,
  rateLimit,
  CidSchema,
  Chart14Edit,
  Chart15,
  docRefs,
} from "@falling-nikochan/chart";
import { getIp, updateIp } from "./dbRateLimit.js";
import { Db } from "mongodb";
import {
  calcETag,
  ChartEntryCompressed,
  chartToEntry,
  etagHeaderDoc,
  getChartEntryCompressed,
  zipEntry,
} from "./chart.js";
import { Context, Hono } from "hono";
import { Bindings, secretSalt } from "../env.js";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import { getYTDataEntry } from "./ytData.js";
import { describeRoute, resolver } from "hono-openapi";
import { errorLiteral, validationErrorSchema } from "../error.js";
import * as v from "valibot";
import { ConnInfo } from "hono/conninfo";
import { supportedEncodings } from "./decompress.js";
import { BaseLogger } from "@hono/structured-logger";

const newChartFileApp = async (config: {
  getConnInfo: (c: Context) => ConnInfo | null;
}) =>
  new Hono<{
    Bindings: Bindings;
    Variables: { logger: BaseLogger; db: () => Promise<Db> };
  }>({
    strict: false,
  }).post(
    "/",
    describeRoute({
      description:
        "Create a new chart. " +
        "The chart data should be in MessagePack format, and " +
        `must be the latest format (Chart15) or one version earlier (Chart14Edit). ` +
        `The chart data may be compressed using ${supportedEncodings.join(", ")} (in that case Content-Encoding header must be set.) ` +
        "Returns the chart ID (cid) of the newly created chart. " +
        `This endpoint is rate limited to one request per ${rateLimit.newChartFile / 60} minutes. `,
      requestBody: {
        description:
          "Chart data in MessagePack format. See also response type of GET /api/chartFile.",
        required: true,
        content: {
          "application/vnd.msgpack": {
            schema: docRefs("Chart15"),
          },
        },
      },
      parameters: [
        {
          name: "Content-Encoding",
          in: "header",
          description: "Encoding applied to the request body",
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.object({ cid: CidSchema() })),
            },
          },
          headers: {
            ...etagHeaderDoc,
          },
        },
        400: {
          description: "password not specified in the chart data",
          content: {
            "application/json": {
              schema: resolver(await errorLiteral("noPasswd")),
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
          description:
            "Invalid chart format, or given Content-Encoding is unsupported",
          content: {
            "application/json": {
              schema: resolver(
                v.union([
                  await validationErrorSchema("invalidChart"),
                  await errorLiteral(
                    "invalidChart",
                    "unsupportedContentEncoding",
                    "invalidContentEncoding"
                  ),
                ])
              ),
            },
          },
          headers: {
            "Accept-Encoding": {
              description: `Supported encoding type (${supportedEncodings.join(", ")})`,
              schema: { type: "string" },
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
          headers: {
            "Retry-After": {
              description: "Number of seconds to wait before retrying",
              schema: { type: "integer" },
            },
          },
        },
      },
    }),
    async (c) => {
      const ip = getIp(c, config.getConnInfo);
      const chartBuf = await c.req.arrayBuffer();
      const pSecretSalt = secretSalt(env(c));
      const db = await c.get("db")();

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

      let newChart: Chart14Edit | Chart15;
      try {
        newChart = msgpack.decode(chartBuf) as Chart14Edit | Chart15;
        if (newChart.ver < currentChartVer - 1) {
          return c.json({ message: "oldChartVersion" }, 409);
        }
        newChart = validateChartWithoutConvert(newChart) as
          | Chart14Edit
          | Chart15;
      } catch (e) {
        throw new HTTPException(415, { message: "invalidChart", cause: e });
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
              await getYTDataEntry(
                c.var.logger,
                env(c),
                db,
                newChart.ytId
              ).catch(() => undefined),
              pSecretSalt,
              null
            )
          )
        );

      const newEntry = await getChartEntryCompressed(db, cid, null);
      return c.json({ cid: cid }, 200, {
        "ETag": await calcETag(newEntry),
      });
    }
  );

export default newChartFileApp;
