import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { createFileEntry, getFileEntry } from "./dbAccess";
import { fsAssign, fsDelete, fsRead, fsWrite } from "./fsAccess";

// todo: password

export async function GET(request: NextRequest, context: { params: Params }) {
  const cid: string = context.params.cid;
  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return NextResponse.json({ ok: false });
  }
  const fsData = await fsRead(fileEntry.fid);
  if (fsData === null) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({ ok: true, data: fsData.data });
}

export async function POST(request: NextRequest, context: { params: Params }) {
  const cid: string = context.params.cid;
  const fileEntry = await getFileEntry(cid);
  let fid: string = null!;
  if (fileEntry === null) {
    const fsRes = await fsAssign();
    if (fsRes === null) {
      return NextResponse.json({ ok: false });
    } else {
      fid = fsRes.fid;
      await createFileEntry(cid, fid);
    }
  } else {
    fid = fileEntry.fid;
  }

  if (!await fsWrite(fid, await request.text())) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Params }
) {
  const cid: string = context.params.cid;
  const fileEntry = await getFileEntry(cid);
  if (fileEntry === null) {
    return NextResponse.json({ ok: false });
  }
  if(!await fsDelete(fileEntry.fid)){
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({ ok: true });
}
