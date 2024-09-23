import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { createFileEntry, getFileEntry } from "@/api/dbAccess";
import { fsAssign, fsDelete, fsRead, fsWrite } from "@/api/fsAccess";

// todo: password

export async function GET() {
  return NextResponse.json({}, { status: 400 });
}

// cidとfidを生成し、bodyのデータを保存して、cidを返す
export async function POST(request: NextRequest, context: { params: Params }) {
  let cid: string;
  while (true) {
    cid = Math.floor(Math.random() * 900000 + 100000).toString();
    const fileEntry = await getFileEntry(cid);
    if (fileEntry !== null) {
      // cidかぶり
      continue;
    } else {
      break;
    }
  }
  let fid: string;
  const fsRes = await fsAssign();
  if (fsRes === null) {
    return NextResponse.json({ message: "fsAssign() failed" }, { status: 500 });
  } else {
    fid = fsRes.fid;
    await createFileEntry(cid, fid);
  }

  if (!(await fsWrite(fid, await request.text()))) {
    return NextResponse.json({ message: "fsWrite() failed" }, { status: 500 });
  }

  return NextResponse.json({ cid: cid });
}
