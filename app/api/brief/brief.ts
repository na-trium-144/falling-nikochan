import { getFileEntry } from "@/api/dbChartFile";
import { ChartBrief } from "@/chartFormat/chart";
import { NextResponse } from "next/server";

export async function getBrief(cid: string): Promise<NextResponse> {
  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }
  return NextResponse.json({
    ytId: fileEntry.ytId,
    title: fileEntry.title,
    composer: fileEntry.composer,
    chartCreator: fileEntry.chartCreator,
  } as ChartBrief);
}
