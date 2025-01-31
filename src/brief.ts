import { entryToBrief, getChartEntry } from "./chart";
import { MongoClient } from "mongodb";

// chartFileとnewChartFileのPOSTでrevalidateする
export function revalidateBrief(cid: string) {
  console.warn(`revalidate brief ${cid}`);
  // todo
  // revalidateTag(`brief-${cid}`);
}

export async function handleGetBrief(
  env: Env,
  cid: string,
  includeLevels: boolean
): Promise<Response> {
  console.log("getBrief", cid);
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const { res, entry } = await getChartEntry(db, cid, null);
    if (!entry) {
      return Response.json(
        { message: res?.message },
        {
          status: res?.status || 500,
        }
      );
    }
    const brief = entryToBrief(entry);
    if (!includeLevels) {
      brief.levels = [];
    }
    return Response.json(brief);
  } finally {
    await client.close();
  }
}
