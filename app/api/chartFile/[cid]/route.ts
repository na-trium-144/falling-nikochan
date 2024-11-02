import { NextRequest, NextResponse } from "next/server";
import { getFileEntry, updateFileEntry } from "@/api/dbChartFile";
import { fsDelete, fsRead, fsWrite } from "@/api/fsAccess";
import msgpack from "@ygoe/msgpack";
import {
  Chart,
  chartMaxSize,
  createBrief,
  hashPasswd,
  validateChart,
} from "@/chartFormat/chart";
import { Params } from "next/dist/server/request/params";

// 他のAPIと違って編集用パスワードのチェックが入る
// クエリパラメータのpで渡す

async function getChart(
  cid: string,
  p: string
): Promise<{ res?: Response; chart?: Chart }> {
  const fileEntry = await getFileEntry(cid, false);
  if (fileEntry === null) {
    return {
      res: NextResponse.json(
        { message: "Chart ID Not Found" },
        { status: 404 }
      ),
    };
  }
  const fsData = await fsRead(fileEntry.fid, null);
  if (fsData === null) {
    return {
      res: NextResponse.json({ message: "fsRead() failed" }, { status: 500 }),
    };
  }

  let chart: Chart;
  try {
    chart = msgpack.deserialize(fsData.data);
    chart = await validateChart(chart);
  } catch (e) {
    return {
      res: NextResponse.json(
        { message: "invalid chart data" },
        { status: 500 }
      ),
    };
  }

  if (p !== (await hashPasswd(chart.editPasswd))) {
    return { res: new Response(null, { status: 401 }) };
  }
  return { chart };
}
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const cid: string = String((await context.params).cid);
  const passwdHash = new URL(request.url).searchParams.get("p");
  const { res, chart } = await getChart(cid, passwdHash || "");
  if (chart) {
    return new Response(new Blob([msgpack.serialize(chart)]));
  }
  return res;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const cid: string = String((await context.params).cid);
  const passwdHash = new URL(request.url).searchParams.get("p");
  const { res, chart } = await getChart(cid, passwdHash || "");
  if (!chart) {
    return res;
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
  const prevHashes = chart.levels.map((l) => l.hash);
  const newHashes = newChart.levels.map((l) => l.hash);
  if (newHashes.every((h, i) => h === prevHashes[i])) {
    newChart.updatedAt = chart.updatedAt;
  } else {
    newChart.updatedAt = new Date().getTime();
  }

  const fileEntry = await getFileEntry(cid, false);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }

  await updateFileEntry(cid, createBrief(newChart));
  if (
    !(await fsWrite(
      fileEntry.fid,
      null,
      new Blob([msgpack.serialize(newChart)])
    ))
  ) {
    return NextResponse.json({ message: "fsWrite() failed" }, { status: 500 });
  }

  return new Response(null);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const cid: string = String((await context.params).cid);
  const passwdHash = new URL(request.url).searchParams.get("p");
  const { res, chart } = await getChart(cid, passwdHash || "");
  if (!chart) {
    return res;
  }

  const fileEntry = await getFileEntry(cid, false);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }
  if (!(await fsDelete(fileEntry.fid, null))) {
    return NextResponse.json({ message: "fsDelete() failed" }, { status: 500 });
  }
  return new Response(null);
}
