import msgpack from "@ygoe/msgpack";
import { MongoClient } from "mongodb";
import { getChartEntry } from "./chart.js";
import { Bindings } from "../env.js";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { convertTo6, Level6Play } from "../../chartFormat/legacy/chart6.js";
import {
  convertTo8,
  convertToPlay8,
  Level8Play,
} from "../../chartFormat/legacy/chart8.js";
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
        throw new HTTPException(404, { message: "Level not found" });
      }

      let level: Level6Play | Level8Play;
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
          level = convertToPlay8(await convertTo8(chart), lvIndex);
          break;
        case 8:
          level = convertToPlay8(chart, lvIndex);
          break;
        default:
          throw new HTTPException(500, { message: "Unsupported chart version" });
      }

      await db
        .collection("chart")
        .updateOne({ cid }, { $inc: { playCount: 1 } });
      // revalidateBrief(cid);

      return c.body(new Blob([msgpack.serialize(level)]).stream());
    } finally {
      await client.close();
    }
  }
);

export default playFileApp;
