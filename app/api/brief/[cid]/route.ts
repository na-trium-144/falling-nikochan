import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { NextRequest } from "next/server";
import { getBrief } from "../brief";

export async function GET(request: NextRequest, context: { params: Params }) {
  const cid: string = context.params.cid;
  const includeLevels: boolean = !!Number(
    new URL(request.url).searchParams.get("levels")
  );
  return getBrief(cid, includeLevels);
}
