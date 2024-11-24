import { NextRequest, NextResponse } from "next/server";
import { getLatest } from "./latest";

export async function GET(request: NextRequest) {
  const latest = await getLatest();
  console.log(latest);
  return NextResponse.json(latest, {
    headers: {
      "cache-control": "max-age=3600",
    },
  });
}
