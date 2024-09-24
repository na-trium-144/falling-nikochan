import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest, NextResponse } from "next/server";
import { fsAssign, fsDelete, fsRead, fsWrite } from "@/api/fsAccess";
import msgpack from "@ygoe/msgpack";
import { Chart, validateChart } from "@/chartFormat/chart";
import { loadChart } from "@/chartFormat/seq";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { join } from "node:path";
import { readFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { checkYouTubeId, getYouTubeId } from "@/common/ytId";
import { cwd } from "node:process";
import { createWaveEntry, getWaveEntry } from "@/api/dbWaveCache";

export async function GET(request: NextRequest, context: { params: Params }) {
  const ytId: string = getYouTubeId(context.params.ytId);
  if (!checkYouTubeId(ytId)) {
    return new Response(null, { status: 400 });
  }

  const waveEntry = await getWaveEntry(ytId);
  if (waveEntry !== null) {
    const fsData = await fsRead(waveEntry.fid);
    if (fsData === null) {
      return NextResponse.json({ message: "fsRead() failed" }, { status: 500 });
    }
    return new Response(fsData.data);
    
  } else {
    const filename = join(tmpdir(), `nikochan-${ytId}-sampled`);
    const yt = await promisify(execFile)(
      "python3",
      [join(cwd(), "app", "api", "wave", "main.py"), ytId],
      { cwd: tmpdir() }
    );
    console.log("stdout:");
    console.log(yt.stdout);
    console.warn("stderr:");
    console.warn(yt.stderr);
    const sampled = await readFile(filename);
    await unlink(filename);

    const fsRes = await fsAssign();
    if (fsRes === null) {
      return NextResponse.json(
        { message: "fsAssign() failed" },
        { status: 500 }
      );
    }
    await createWaveEntry(ytId, fsRes.fid);

    if (!(await fsWrite(fsRes.fid, new Blob([sampled])))) {
      return NextResponse.json(
        { message: "fsWrite() failed" },
        { status: 500 }
      );
    }

    return new Response(sampled);
  }
}
