import msgpack from "@ygoe/msgpack";
import { MongoClient } from "mongodb";
import { getChartEntry } from "./chart.js";
import { Bindings } from "../env.js";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { convertTo6 } from "../../chartFormat/legacy/chart6.js";
import { ChartSeqData6, loadChart6 } from "../../chartFormat/legacy/seq6.js";
import { ChartSeqData7, loadChart7 } from "../../chartFormat/legacy/seq7.js";
import { HTTPException } from "hono/http-exception";

const seqFileApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
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

      let seq: ChartSeqData6 | ChartSeqData7;
      switch (chart.ver) {
        case 4:
        case 5:
          seq = loadChart6(await convertTo6(chart), lvIndex);
          break;
        case 6:
          seq = loadChart6(chart, lvIndex);
          break;
        case 7:
          seq = loadChart7(chart, lvIndex);
          break;
        default:
          throw new HTTPException(500, { message: "Unsupported chart version" });
      }

      await db
        .collection("chart")
        .updateOne({ cid }, { $inc: { playCount: 1 } });
      // revalidateBrief(cid);

      return c.body(new Blob([msgpack.serialize(seq)]).stream());
    } finally {
      await client.close();
    }
  }
);

export default seqFileApp;
