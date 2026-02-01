import msgpack from "@msgpack/msgpack";
import { MongoClient } from "mongodb";
import { getChartEntry } from "./chart.js";
import { Bindings } from "../env.js";
import { Hono } from "hono";
import { env } from "hono/adapter";
import {
  convertTo6,
  Level6Play,
  CidSchema,
  Level13Play,
  LevelPlaySchema13,
  currentChartVer,
  convertToPlay14,
  convertTo14,
} from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import { errorLiteral } from "../error.js";

const playFileApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid/:lvIndex",
  describeRoute({
    description:
      "Gets level data in MessagePack format, which is only used for playing the chart, not for editing. " +
      "Note that the level data is either in Chart6Play or Chart13Play format, " +
      `while this documentation only describes Chart${currentChartVer}Play format. `,
    responses: {
      200: {
        description: "chart file in MessagePack format.",
        content: {
          "application/vnd.msgpack": {
            schema: resolver(LevelPlaySchema13()),
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

      let level: Level6Play | Level13Play;
      switch (chart.ver) {
        case 4:
        case 5:
          if (!chart.levels.at(lvIndex)) {
            throw new HTTPException(404, { message: "levelNotFound" });
          }
          level = {
            ...(await convertTo6(chart)).levels.at(lvIndex)!,
            ver: 6,
            offset: chart.offset,
          };
          break;
        case 6:
          if (!chart.levels.at(lvIndex)) {
            throw new HTTPException(404, { message: "levelNotFound" });
          }
          level = {
            ...chart.levels.at(lvIndex)!,
            ver: 6,
            offset: chart.offset,
          };
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
          level = convertToPlay14(await convertTo14(chart), lvIndex);
          break;
        case 14:
          if (!chart.levelsMin.at(lvIndex) || !chart.levelsFreeze.at(lvIndex)) {
            throw new HTTPException(404, { message: "levelNotFound" });
          }
          level = convertToPlay14(chart, lvIndex);
          break;
        default:
          chart satisfies never;
          throw new HTTPException(500, { message: "unsupportedChartVersion" });
      }

      return c.body(new Blob([msgpack.encode(level)]).stream(), 200, {
        "Content-Type": "application/vnd.msgpack",
      });
    } finally {
      await client.close();
    }
  }
);

export default playFileApp;
