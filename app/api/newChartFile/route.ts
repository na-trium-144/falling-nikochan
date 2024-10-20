import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { createFileEntry, getFileEntry } from "@/api/dbChartFile";
import { fsAssign, fsWrite } from "@/api/fsAccess";
import msgpack from "@ygoe/msgpack";
import {
  Chart,
  chartMaxSize,
  createBrief,
  validateChart,
} from "@/chartFormat/chart";
import { rateLimitMin, updateLastCreate } from "../dbRateLimit";
import { headers } from "next/headers";

export async function GET() {
  const headersList = headers();
  console.log(headersList.get("x-forwarded-for"));
  return new Response(null, { status: 400 });
}

// cidとfidを生成し、bodyのデータを保存して、cidを返す
export async function POST(request: NextRequest, context: { params: Params }) {
  const headersList = headers();
  console.log(headersList.get("x-forwarded-for"));
  const ip = String(
    headersList.get("x-forwarded-for")?.split(",").at(-1)?.trim()
  ); // nullもundefinedも文字列にしちゃう
  if (process.env.NODE_ENV !== "development" && !(await updateLastCreate(ip))) {
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
  chart.updatedAt = new Date().getTime();

  let cid: string;
  while (true) {
    cid = Math.floor(Math.random() * 900000 + 100000).toString();
    const fileEntry = await getFileEntry(cid, false);
    if (fileEntry !== null) {
      // cidかぶり
      continue;
    } else {
      break;
    }
  }
  let fid: string;
  const fsRes = await fsAssign();
  if (fsRes === null) {
    return NextResponse.json({ message: "fsAssign() failed" }, { status: 500 });
  } else {
    fid = fsRes.fid;
    await createFileEntry(cid, fid, createBrief(chart));
  }

  if (!(await fsWrite(fid, fsRes.volumeUrl, new Blob([msgpack.serialize(chart)])))) {
    return NextResponse.json({ message: "fsWrite() failed" }, { status: 500 });
  }

  return NextResponse.json({ cid: cid });
}
