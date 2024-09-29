import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { createFileEntry, getFileEntry } from "@/api/dbChartFile";
import { fsAssign, fsWrite } from "@/api/fsAccess";
import msgpack from "@ygoe/msgpack";
import { Chart, chartMaxSize, validateChart } from "@/chartFormat/chart";
import { updateLastCreate } from "../dbRateLimit";
import { headers } from "next/headers";

// todo: password

export async function GET() {
  return new Response(null, { status: 400 });
}

// cidとfidを生成し、bodyのデータを保存して、cidを返す
export async function POST(request: NextRequest, context: { params: Params }) {
  const headersList = headers();
  const ip = headersList.get("x-forwarded-for");
  console.log(ip);
  if (ip === null) {
    console.error("ip is null");
    return new Response(null, { status: 500 });
  }
  if (!(await updateLastCreate(ip))) {
    return NextResponse.json(
      { message: "Too many requests, please retry 30 minutes later" },
      { status: 429, headers: [["retry-after", (30 * 60).toString()]] }
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

  let chartBlob: Blob;
  let chart: Chart;
  try {
    chart = msgpack.deserialize(chartBuf);
    chart = validateChart(chart);
    chartBlob = new Blob([msgpack.serialize(chart)]);
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { message: "invalid chart data" },
      { status: 400 }
    );
  }

  let cid: string;
  while (true) {
    cid = Math.floor(Math.random() * 900000 + 100000).toString();
    const fileEntry = await getFileEntry(cid);
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
    await createFileEntry(cid, fid, chart);
  }

  if (!(await fsWrite(fid, chartBlob))) {
    return NextResponse.json({ message: "fsWrite() failed" }, { status: 500 });
  }

  return NextResponse.json({ cid: cid });
}
