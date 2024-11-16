import { NextRequest, NextResponse } from "next/server";
import msgpack from "@ygoe/msgpack";
import { Chart, chartMaxSize, validateChart } from "@/chartFormat/chart";
import { rateLimitMin, updateIpLastCreate } from "../dbRateLimit";
import { headers } from "next/headers";
import { MongoClient } from "mongodb";
import { chartToEntry, getChartEntry, zipEntry } from "../chart";

export async function GET() {
  const headersList = await headers();
  console.log(headersList.get("x-forwarded-for"));
  return new Response(null, { status: 400 });
}

// cidとfidを生成し、bodyのデータを保存して、cidを返す
export async function POST(request: NextRequest) {
  const headersList = await headers();
  console.log(headersList.get("x-forwarded-for"));
  const ip = String(
    headersList.get("x-forwarded-for")?.split(",").at(-1)?.trim()
  ); // nullもundefinedも文字列にしちゃう

  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("nikochan");

    if (
      /*process.env.NODE_ENV !== "development" &&*/
      !(await updateIpLastCreate(db, ip))
    ) {
      return NextResponse.json(
        {
          message: `Too many requests, please retry ${rateLimitMin} minutes later`,
        },
        {
          status: 429,
          headers: [["retry-after", (rateLimitMin * 60).toString()]],
        }
      );
    }

    const chartBuf = await request.arrayBuffer();
    if (chartBuf.byteLength > chartMaxSize) {
      return NextResponse.json(
        {
          message:
            `Chart too large (${Math.round(chartBuf.byteLength / 1000)}kB),` +
            `Max ${Math.round(chartMaxSize / 1000)}kB`,
        },
        { status: 413 }
      );
    }

    let chart: Chart;
    try {
      chart = msgpack.deserialize(chartBuf);
      chart = await validateChart(chart);
    } catch (e) {
      console.log(e);
      return NextResponse.json(
        { message: "invalid chart data" },
        { status: 400 }
      );
    }

    // update Time
    const updatedAt = new Date().getTime();

    let cid: string;
    while (true) {
      cid = Math.floor(Math.random() * 900000 + 100000).toString();
      const { entry } = await getChartEntry(db, cid, null);
      if (entry) {
        // cidかぶり
        continue;
      } else {
        break;
      }
    }

    await db
      .collection("chart")
      .insertOne(await zipEntry(await chartToEntry(chart, cid, updatedAt)));

    return NextResponse.json({ cid: cid });
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}
