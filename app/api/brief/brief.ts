import { entryToBrief, getChartEntry } from "../chart";
import { MongoClient } from "mongodb";
import "dotenv/config";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { ChartBrief } from "@/chartFormat/chart";
import { originalCId, sampleCId } from "@/main/const";

async function getBriefImpl(cid: string) {
  console.log("getBriefImpl", cid);
  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const { res, entry } = await getChartEntry(db, cid, null);
    if (!entry) {
      return { res };
    }

    return { brief: entryToBrief(entry) };
  } finally {
    await client.close();
  }
}
// chartFileとnewChartFileのPOSTでrevalidateする
export function revalidateBrief(cid: string) {
  console.warn(`revalidate brief ${cid}`);
  revalidateTag(`brief-${cid}`);
}

export async function getBrief(
  cid: string,
  includeLevels: boolean
): Promise<{ res?: { message: string; status: number }; brief?: ChartBrief }> {
  const getBriefCache = unstable_cache(() => getBriefImpl(cid), [cid], {
    tags: [`brief-${cid}`],
    revalidate: false,
  });
  try {
    const { res, brief } = await getBriefCache();
    if (brief && !includeLevels) {
      return { res, brief: { ...brief, levels: [] } };
    }
    return { res, brief };
  } catch (e) {
    console.error(e);
    return { res: { message: "internal server error", status: 500 } };
  }
}
