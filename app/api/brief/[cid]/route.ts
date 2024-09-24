import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { getFileEntry } from "@/api/dbChartFile";
import { ChartBrief } from "@/chartFormat/chart";

export async function GET(request: NextRequest, context: { params: Params }) {
  const cid: string = context.params.cid;
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
