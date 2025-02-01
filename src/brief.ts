import { ChartBrief } from "@/chartFormat/chart";
import { entryToBrief, getChartEntry } from "./chart";
import { MongoClient } from "mongodb";

// chartFileとnewChartFileのPOSTでrevalidateする
export function revalidateBrief(cid: string) {
  console.warn(`revalidate brief ${cid}`);
  // todo
  // revalidateTag(`brief-${cid}`);
}

export async function getBrief(
  env: Env,
  cid: string,
  includeLevels: boolean
): Promise<{ res?: { message: string; status: number }; brief?: ChartBrief }> {
  console.log("getBrief", cid);
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const { res, entry } = await getChartEntry(db, cid, null);
    if (!entry) {
      return { res };
    }
    const brief = entryToBrief(entry);
    if (!includeLevels) {
      brief.levels = [];
    }
    return { brief };
  } finally {
    await client.close();
  }
}

export async function handleGetBrief(
  env: Env,
  cid: string,
  includeLevels: boolean
): Promise<Response> {
  console.log("getBrief", cid);
  const { res, brief } = await getBrief(env, cid, includeLevels);
  if (!brief) {
    return Response.json(
      { message: res?.message },
      {
        status: res?.status || 500,
      }
    );
  }
  return Response.json(brief);
}
