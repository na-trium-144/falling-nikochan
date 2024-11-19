import { NextRequest, NextResponse } from "next/server";
import msgpack from "@ygoe/msgpack";
import {
  Chart,
  chartMaxSize,
  hashLevel,
  validateChart,
} from "@/chartFormat/chart";
import { Params } from "next/dist/server/request/params";
import { MongoClient } from "mongodb";
import "dotenv/config";
import { chartToEntry, getChartEntry, zipEntry } from "@/api/chart";
import { revalidateBrief } from "@/api/brief/brief";

// 他のAPIと違って編集用パスワードのチェックが入る
// クエリパラメータのpで渡す

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const cid: string = String((await context.params).cid);
  const passwdHash = new URL(request.url).searchParams.get("p");

  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("nikochan");
    let { res, chart } = await getChartEntry(db, cid, passwdHash || "");
    if (!chart) {
      return NextResponse.json(
        { message: res?.message },
        { status: res?.status || 500 }
      );
    }
    try {
      chart = await validateChart(chart);
    } catch (e) {
      return NextResponse.json(
        { message: "invalid chart data" },
        { status: 500 }
      );
    }
    return new Response(new Blob([msgpack.serialize(chart)]));
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const cid: string = String((await context.params).cid);
  const passwdHash = new URL(request.url).searchParams.get("p");

  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const { res, entry, chart } = await getChartEntry(
      db,
      cid,
      passwdHash || ""
    );
    if (!chart || !entry) {
      return NextResponse.json(
        { message: res?.message },
        { status: res?.status || 500 }
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

    let newChart: Chart;
    try {
      newChart = msgpack.deserialize(chartBuf);
      newChart = await validateChart(newChart);
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { message: "invalid chart data" },
        { status: 400 }
      );
    }

    // update Time
    const prevHashes = entry.levelBrief.map((l) => l.hash);
    const newHashes = await Promise.all(
      newChart.levels.map((level) => hashLevel(level))
    );
    let updatedAt = entry.updatedAt;
    if (!newHashes.every((h, i) => h === prevHashes[i])) {
      updatedAt = new Date().getTime();
    }

    await db.collection("chart").updateOne(
      { cid },
      {
        $set: await zipEntry(
          await chartToEntry(newChart, cid, updatedAt, entry)
        ),
      }
    );
    revalidateBrief(cid);
    return new Response(null);
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const cid: string = String((await context.params).cid);
  const passwdHash = new URL(request.url).searchParams.get("p");

  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const { res, chart } = await getChartEntry(db, cid, passwdHash || "");
    if (!chart) {
      return NextResponse.json(
        { message: res?.message },
        { status: res?.status || 500 }
      );
    }

    await db.collection("chart").updateOne(
      { cid },
      {
        $set: {
          levelsCompressed: "",
          deleted: true,
        },
      }
    );
    revalidateBrief(cid);
    return new Response(null);
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}
