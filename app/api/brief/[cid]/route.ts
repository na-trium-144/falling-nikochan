import { NextRequest, NextResponse } from "next/server";
import { getBrief } from "../brief";
import { Params } from "next/dist/server/request/params";

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const cid: string = String((await context.params).cid);
  const includeLevels: boolean = !!Number(
    new URL(request.url).searchParams.get("levels")
  );
  const { res, brief } = await getBrief(cid, includeLevels);
  if (brief) {
    return NextResponse.json(brief, {
      headers: {
        "cache-control": "max-age=3600",
      },
    });
  } else {
    return NextResponse.json(
      { message: res?.message },
      {
        status: res?.status || 500,
        headers: {
          "cache-control": "max-age=3600",
        },
      }
    );
  }
}
