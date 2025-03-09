import msgpack from "@ygoe/msgpack";
import { MongoClient } from "mongodb";
import { getChartEntry } from "./chart.js";
import { Bindings } from "../env.js";
import { Hono } from "hono";
import { env } from "hono/adapter";
import {
  convertTo6,
  Level6Play,
  Level9Play,
  convertToPlay9,
  convertTo9,
} from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";

const playFileApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid/:lvIndex",
  async (c) => {
    const cid = c.req.param("cid");
    const lvIndex = Number(c.req.param("lvIndex"));
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      let { chart } = await getChartEntry(db, cid, null);

      if (!chart.levels.at(lvIndex)) {
        throw new HTTPException(404, { message: "levelNotFound" });
      }

      let level: Level6Play | Level9Play;
      switch (chart.ver) {
        case 4:
        case 5:
          level = {
            ...(await convertTo6(chart)).levels.at(lvIndex)!,
            ver: 6,
            offset: chart.offset,
          };
          break;
        case 6:
          level = {
            ...chart.levels.at(lvIndex)!,
            ver: 6,
            offset: chart.offset,
          };
          break;
        case 7:
        case 8:
          level = convertToPlay9(await convertTo9(chart), lvIndex);
          break;
        case 9:
          level = convertToPlay9(chart, lvIndex);
          break;
        default:
          throw new HTTPException(500, { message: "unsupportedChartVersion" });
      }

      await db
        .collection("chart")
        .updateOne({ cid }, { $inc: { playCount: 1 } });
      // revalidateBrief(cid);

      return c.body(new Blob([msgpack.serialize(level)]).stream(), 200, {
        "Content-Type": "application/vnd.msgpack",
      });
    } finally {
      await client.close();
    }
  },
);

export default playFileApp;
