import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { getFileEntry, updateFileEntry } from "@/api/dbChartFile";
import { fsDelete, fsRead, fsWrite } from "@/api/fsAccess";
import msgpack from "@ygoe/msgpack";
import { Chart, validateChart } from "@/chartFormat/chart";
import { loadChart } from "@/chartFormat/seq";

// todo: password

export async function GET(request: NextRequest, context: { params: Params }) {
  const cid: string = context.params.cid;
  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }
  const fsData = await fsRead(fileEntry.fid);
  if (fsData === null) {
    return NextResponse.json({ message: "fsRead() failed" }, { status: 500 });
  }

  let chart: Chart;
  try {
    chart = msgpack.deserialize(fsData.data);
    validateChart(chart);
  } catch (e) {
    return NextResponse.json(
      { message: "invalid chart data" },
      { status: 500 }
    );
  }

  const seq = loadChart(chart);
  return new Response(new Blob([msgpack.serialize(seq)]));
}
