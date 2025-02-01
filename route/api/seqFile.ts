import msgpack from "@ygoe/msgpack";
import { validateChart } from "@/chartFormat/chart";
import { loadChart } from "@/chartFormat/seq";
import { MongoClient } from "mongodb";
import { getChartEntry } from "./chart";
import "dotenv/config";
import { Bindings } from "../env";
import { Hono } from "hono";

const seqFileApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid/:lvIndex",
  async (c) => {
    const cid = c.req.param("cid");
    const lvIndex = Number(c.req.param("lvIndex"));
    const client = new MongoClient(c.env.MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      let { res, chart } = await getChartEntry(db, cid, null);
      if (!chart) {
        return c.json({ message: res?.message }, res?.status || 500);
      }

      try {
        chart = await validateChart(chart);
      } catch {
        return c.json({ message: "invalid chart data" }, 500);
      }
      if (!chart.levels.at(lvIndex)) {
        return c.json(
          {
            message: "Level not found",
          },
          404
        );
      }
      const seq = loadChart(chart, lvIndex);

      await db
        .collection("chart")
        .updateOne({ cid }, { $inc: { playCount: 1 } });
      // revalidateBrief(cid);

      return c.body(new Blob([msgpack.serialize(seq)]).stream());
    } catch (e) {
      console.error(e);
      return c.body(null, 500);
    } finally {
      await client.close();
    }
  }
);

export default seqFileApp;
