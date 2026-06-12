import * as msgpack from "@msgpack/msgpack";
import { Db } from "mongodb";
import {
  etagHeaderDoc,
  getChartEntry,
  ifMatchHeaderDoc,
  ifNoneMatchHeaderDoc,
} from "./chart.js";
import { Bindings } from "../env.js";
import { Hono } from "hono";
import {
  convertTo6,
  CidSchema,
  ChartSeqData,
  loadChart,
  convertTo15,
  convertToPlay15,
  docRefs,
} from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  errorLiteral,
  sValidatorHook,
  validationErrorSchema,
} from "../error.js";

const seqFileApp = new Hono<{
  Bindings: Bindings;
  Variables: { db: () => Promise<Db> };
}>({
  strict: false,
}).get(
  "/:cid/:lvIndex",
  describeRoute({
    description:
      "Gets chart sequence data in MessagePack format, which is used for playing the chart.",
    parameters: [ifNoneMatchHeaderDoc, ifMatchHeaderDoc],
    responses: {
      200: {
        description: "chart sequence data in MessagePack format.",
        content: {
          "application/vnd.msgpack": {
            schema: docRefs("ChartSeqData"),
          },
        },
        headers: {
          "Content-Disposition": {
            description: "Filename with extension of .fnseq.mpk",
            schema: { type: "string" },
          },
          "Cache-Control": {
            description: `no-cache`,
            schema: { type: "string" },
          },
          ...etagHeaderDoc,
        },
      },
      304: {
        description: "No content if If-None-Match header matches",
      },
      400: {
        description: "invalid chart id",
        content: {
          "application/json": {
            schema: resolver(await validationErrorSchema()),
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
      412: {
        description: "ETag does not match with given If-Match header",
        content: {
          "application/json": {
            schema: resolver(await errorLiteral("etagMismatch")),
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
    }),
    sValidatorHook()
  ),
  async (c) => {
    const { cid, lvIndex } = c.req.valid("param");

    const db = await c.get("db")();
    let { chart, etag } = await getChartEntry(
      db,
      cid,
      null,
      c.req.header("X-If-Match") ?? c.req.header("If-Match")
    );

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
        seqData = loadChart(convertToPlay15(await convertTo15(chart), lvIndex));
        break;
      case 14:
        if (!chart.levelsMin.at(lvIndex) || !chart.levelsFreeze.at(lvIndex)) {
          throw new HTTPException(404, { message: "levelNotFound" });
        }
        seqData = loadChart(convertToPlay15(await convertTo15(chart), lvIndex));
        break;
      case 15:
      case 16:
        if (!chart.levelsMeta.at(lvIndex) || !chart.levelsFreeze.at(lvIndex)) {
          throw new HTTPException(404, { message: "levelNotFound" });
        }
        seqData = loadChart(convertToPlay15(chart, lvIndex));
        break;
      default:
        chart satisfies never;
        throw new HTTPException(409, { message: "unsupportedChartVersion" });
    }

    const filename = `${cid}.${lvIndex}.fnseq.mpk`;
    return c.body(new Blob([msgpack.encode(seqData)]).stream(), 200, {
      "Content-Type": "application/vnd.msgpack",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
      "ETag": etag,
    });
  }
);

export default seqFileApp;
