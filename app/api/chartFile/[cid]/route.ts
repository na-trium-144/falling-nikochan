import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { createFileEntry, getFileEntry } from "@/api/dbAccess";
import { fsAssign, fsDelete, fsRead, fsWrite } from "@/api/fsAccess";
import msgpack from "@ygoe/msgpack";
import { validateChart } from "@/chartFormat/command";

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

  let chartBlob: Blob;
  try {
    const chart = msgpack.deserialize(fsData.data);
    validateChart(chart);
    chartBlob = new Blob([msgpack.serialize(chart)]);
  } catch (e) {
    return NextResponse.json(
      { message: "invalid chart data" },
      { status: 500 }
    );
  }

  return new Response(chartBlob);
}

export async function POST(request: NextRequest, context: { params: Params }) {
  let chartBlob: Blob;
  try {
    const chart = msgpack.deserialize(await request.arrayBuffer());
    validateChart(chart);
    chartBlob = new Blob([msgpack.serialize(chart)]);
  } catch (e) {
    return NextResponse.json(
      { message: "invalid chart data" },
      { status: 400 }
    );
  }

  const cid: string = context.params.cid;
  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }

  if (!(await fsWrite(fileEntry.fid, chartBlob))) {
    return NextResponse.json({ message: "fsWrite() failed" }, { status: 500 });
  }

  return NextResponse.json({});
}

export async function DELETE(
  request: NextRequest,
  context: { params: Params }
) {
  const cid: string = context.params.cid;
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
  return NextResponse.json({});
}
