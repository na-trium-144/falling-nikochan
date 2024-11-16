import { NextRequest, NextResponse } from "next/server";
import msgpack from "@ygoe/msgpack";
import { Chart, validateChart } from "@/chartFormat/chart";
import { loadChart } from "@/chartFormat/seq";
import { Params } from "next/dist/server/request/params";
import { MongoClient } from "mongodb";
import { getChartEntry } from "@/api/chart";

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const cid: string = String((await context.params).cid);
  const lvIndex = Number((await context.params).lvIndex);

  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("nikochan");
    let { res, entry, chart } = await getChartEntry(db, cid, null);
    if (!chart) {
      return res!;
    }

    try {
      chart = await validateChart(chart);
    } catch (e) {
      return NextResponse.json(
        { message: "invalid chart data" },
        { status: 500 }
      );
    }
    if (!chart.levels.at(lvIndex)) {
      return NextResponse.json(
        {
          message: "Level not found",
        },
        { status: 404 }
      );
    }
    const seq = loadChart(chart, lvIndex);

    await db.collection("chart").updateOne({ cid }, { $inc: { playCount: 1 } });

    return new Response(new Blob([msgpack.serialize(seq)]));
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}
