import { NextRequest, NextResponse } from "next/server";
import { getFileEntry, updatePlayCount } from "@/api/dbChartFile";
import { fsRead } from "@/api/fsAccess";
import msgpack from "@ygoe/msgpack";
import { Chart, validateChart } from "@/chartFormat/chart";
import { loadChart } from "@/chartFormat/seq";
import { Params } from "next/dist/server/request/params";

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const cid: string = String((await context.params).cid);
  const lvIndex = Number((await context.params).lvIndex);
  const fileEntry = await getFileEntry(cid, false);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }
  const fsData = await fsRead(fileEntry.fid, null);
  if (fsData === null) {
    return NextResponse.json({ message: "fsRead() failed" }, { status: 500 });
  }

  let chart: Chart;
  try {
    chart = msgpack.deserialize(fsData.data);
    chart = await validateChart(chart);
  } catch (e) {
    return NextResponse.json(
      { message: "invalid chart data" },
      { status: 500 }
    );
  }
  if (!chart.levels[lvIndex]) {
    return NextResponse.json(
      {
        message: "Level not found",
      },
      { status: 404 }
    );
  }
  const seq = loadChart(chart, lvIndex);

  await updatePlayCount(cid);

  return new Response(new Blob([msgpack.serialize(seq)]));
}
