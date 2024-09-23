import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { createFileEntry, getFileEntry } from "@/api/dbAccess";
import { fsAssign, fsDelete, fsRead, fsWrite } from "@/api/fsAccess";

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
  // todo: chartがちゃんとchartの中身をしているかチェック
  return NextResponse.json({ chart: JSON.parse(fsData.data) });
}

export async function POST(request: NextRequest, context: { params: Params }) {
  const cid: string = context.params.cid;
  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return NextResponse.json(
      { message: "Chart ID Not Found" },
      { status: 404 }
    );
  }

  if (!(await fsWrite(fileEntry.fid, await request.text()))) {
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
