import { NextRequest } from "next/server";
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
  return getBrief(cid, includeLevels);
}
