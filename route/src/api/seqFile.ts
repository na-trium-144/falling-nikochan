import * as msgpack from "@msgpack/msgpack";
import { MongoClient } from "mongodb";
import { getChartEntry } from "./chart.js";
import { Bindings } from "../env.js";
import { Hono } from "hono";
import { env } from "hono/adapter";
import {
  convertTo6,
  CidSchema,
  currentChartVer,
  convertTo14,
  convertToPlay14,
  ChartSeqData,
  loadChart,
} from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import { errorLiteral } from "../error.js";

// Define schema for ChartSeqData13 for OpenAPI documentation
const ChartSeqDataSchema = () =>
  v.object({
    notes: v.array(v.any()),
    bpmChanges: v.array(v.any()),
    speedChanges: v.array(v.any()),
    signature: v.array(v.any()),
    offset: v.number(),
    ytBegin: v.number(),
    ytEndSec: v.number(),
  });

const seqFileApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid/:lvIndex",
  describeRoute({
    description:
      "Gets chart sequence data in MessagePack format, which is used for playing the chart. " +
      "Returns ChartSeqData6 for chart versions 6 and below, or ChartSeqData13 for chart versions 7-13. " +
      `Note that this documentation only describes ChartSeqData${currentChartVer} format.`,
    responses: {
      200: {
        description: "chart sequence data in MessagePack format.",
        content: {
          "application/vnd.msgpack": {
            schema: resolver(ChartSeqDataSchema()),
          },
        },
      },
      400: {
        description: "invalid chart id",
        content: {
          "application/json": {
            schema: resolver(v.object({ message: v.string() })),
          },
        },
      },
      404: {
        description: "chart id not found or level index out of range",
        content: {
          "application/json": {
            schema: resolver(
              await errorLiteral("chartIdNotFound", "levelNotFound")
            ),
          },
        },
      },
    },
  }),
  validator(
    "param",
    v.object({
      cid: CidSchema(),
      lvIndex: v.pipe(v.string(), v.regex(/^[0-9]+$/), v.transform(Number)),
    })
  ),
  async (c) => {
    const { cid, lvIndex } = c.req.valid("param");

    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      let { chart } = await getChartEntry(db, cid, null);

      let seqData: ChartSeqData;
      switch (chart.ver) {
        case 4:
        case 5:
          if (!chart.levels.at(lvIndex)) {
            throw new HTTPException(404, { message: "levelNotFound" });
          }
          seqData = loadChart({
            ...(await convertTo6(chart)).levels.at(lvIndex)!,
            ver: 6,
            offset: chart.offset,
          });
          break;
        case 6:
          if (!chart.levels.at(lvIndex)) {
            throw new HTTPException(404, { message: "levelNotFound" });
          }
          seqData = loadChart({
            ...chart.levels.at(lvIndex)!,
            ver: 6,
            offset: chart.offset,
          });
          break;
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
        case 13:
          if (!chart.levels.at(lvIndex)) {
            throw new HTTPException(404, { message: "levelNotFound" });
          }
          seqData = loadChart(
            convertToPlay14(await convertTo14(chart), lvIndex)
          );
          break;
        case 14:
          if (!chart.levelsMin.at(lvIndex) || !chart.levelsFreeze.at(lvIndex)) {
            throw new HTTPException(404, { message: "levelNotFound" });
          }
          seqData = loadChart(convertToPlay14(chart, lvIndex));
          break;
        default:
          chart satisfies never;
          throw new HTTPException(500, { message: "unsupportedChartVersion" });
      }

      const filename = `${cid}.${lvIndex}.fnseq.mpk`;
      return c.body(new Blob([msgpack.encode(seqData)]).stream(), 200, {
        "Content-Type": "application/vnd.msgpack",
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
    } finally {
      await client.close();
    }
  }
);

export default seqFileApp;
