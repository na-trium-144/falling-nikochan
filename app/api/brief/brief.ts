import { NextResponse } from "next/server";
import { entryToBrief, getChartEntry } from "../chart";
import { MongoClient } from "mongodb";

export async function getBrief(
  cid: string,
  includeLevels: boolean
): Promise<Response> {
  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const { res, entry } = await getChartEntry(db, cid, null);
    if (!entry) {
      return res!;
    }

    const brief = entryToBrief(entry);
    if (!includeLevels) {
      brief.levels = [];
    }
    return NextResponse.json(brief);
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}
