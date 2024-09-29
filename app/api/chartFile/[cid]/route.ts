import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { getFileEntry, updateFileEntry } from "@/api/dbChartFile";
import { fsDelete, fsRead, fsWrite } from "@/api/fsAccess";
import msgpack from "@ygoe/msgpack";
import { Chart, hashPasswd, validateChart } from "@/chartFormat/chart";

// 他のAPIと違って編集用パスワードのチェックが入る
// クエリパラメータのpで渡す

async function getChart(cid: string, p: string): Promise<{res?: Response, chart?: Chart}> {
  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return {res: NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    )};
  }
  const fsData = await fsRead(fileEntry.fid);
  if (fsData === null) {
    return {res: NextResponse.json({ message: "fsRead() failed" }, { status: 500 })};
  }

  let chart: Chart;
  try {
    chart = msgpack.deserialize(fsData.data);
    chart = validateChart(chart);
  } catch (e) {
    return {res: NextResponse.json(
      { message: "invalid chart data" },
      { status: 500 }
    )};
  }

  if (p !== (await hashPasswd(chart.editPasswd))) {
    return {res: new Response(null, { status: 401 })};
  }
  return {chart};
}
export async function GET(request: NextRequest, context: { params: Params }) {
  const cid: string = context.params.cid;
  const passwdHash = new URL(request.url).searchParams.get("p");
  const {res, chart} = await getChart(cid, passwdHash || "");
  if(chart){
    return new Response(new Blob([msgpack.serialize(chart)]));
  }
  return res;
}

export async function POST(request: NextRequest, context: { params: Params }) {
  const cid: string = context.params.cid;
  const passwdHash = new URL(request.url).searchParams.get("p");
  const {res, chart} = await getChart(cid, passwdHash || "");
  if(!chart){
    return res;
  }

  let newChart: Chart;
  try {
    newChart = msgpack.deserialize(await request.arrayBuffer());
    newChart = validateChart(newChart);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "invalid chart data" },
      { status: 400 }
    );
  }
  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }

  await updateFileEntry(cid, newChart);
  if (!(await fsWrite(fileEntry.fid, new Blob([msgpack.serialize(newChart)])))) {
    return NextResponse.json({ message: "fsWrite() failed" }, { status: 500 });
  }

  return new Response(null);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Params }
) {
  const cid: string = context.params.cid;
  const passwdHash = new URL(request.url).searchParams.get("p");
  const {res, chart} = await getChart(cid, passwdHash || "");
  if(!chart){
    return res;
  }

  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }
  if (!(await fsDelete(fileEntry.fid))) {
    return NextResponse.json({ message: "fsDelete() failed" }, { status: 500 });
  }
  return new Response(null);
}
