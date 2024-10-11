import { getFileEntry, updateFileEntry } from "@/api/dbChartFile";
import { Chart, ChartBrief, createBrief, validateChart } from "@/chartFormat/chart";
import { NextResponse } from "next/server";
import { fsRead } from "../fsAccess";
import msgpack from "@ygoe/msgpack";
import { difficulty } from "@/chartFormat/difficulty";

export async function getBrief(cid: string): Promise<NextResponse> {
  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }
  if (fileEntry.levels.length > 0) {
    return NextResponse.json({
      ytId: fileEntry.ytId,
      title: fileEntry.title,
      composer: fileEntry.composer,
      chartCreator: fileEntry.chartCreator,
      levels: fileEntry.levels,
    } as ChartBrief);
  } else {
    const fsData = await fsRead(fileEntry.fid);
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
    const brief = createBrief(chart);
    await updateFileEntry(cid, brief);
    return NextResponse.json(brief);
  }
}
