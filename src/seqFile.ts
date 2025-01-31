import msgpack from "@ygoe/msgpack";
import { Chart, validateChart } from "@/chartFormat/chart";
import { loadChart } from "@/chartFormat/seq";
import { MongoClient } from "mongodb";
import { getChartEntry } from "./chart";
import { revalidateBrief } from "./brief";

export async function handleGetSeqFile(env: Env, cid: string, lvIndex: number) {
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    let { res, entry, chart } = await getChartEntry(db, cid, null);
    if (!chart) {
      return Response.json(
        { message: res?.message },
        {
          status: res?.status || 500,
        }
      );
    }

    try {
      chart = await validateChart(chart);
    } catch (e) {
      return Response.json(
        { message: "invalid chart data" },
        {
          status: 500,
        }
      );
    }
    if (!chart.levels.at(lvIndex)) {
      return new Response(
        JSON.stringify({
          message: "Level not found",
        }),
        { status: 404 }
      );
    }
    const seq = loadChart(chart, lvIndex);

    await db.collection("chart").updateOne({ cid }, { $inc: { playCount: 1 } });
    revalidateBrief(cid);

    return new Response(new Blob([msgpack.serialize(seq)]));
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}
