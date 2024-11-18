import { entryToBrief, getChartEntry } from "../chart";
import { MongoClient } from "mongodb";
import "dotenv/config";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { ChartBrief } from "@/chartFormat/chart";

const getBriefCache = unstable_cache(
  async (cid: string) => {
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
  },
  [],
  { tags: ["brief"], revalidate: false }
);
// chartFileとnewChartFileのPOSTでrevalidateする
export function revalidateBrief(){
  console.warn("revalidate brief");
  revalidateTag("brief");
  revalidatePath("/main/play");
}

export async function getBrief(
  cid: string,
  includeLevels: boolean
): Promise<{ res?: { message: string; status: number }; brief?: ChartBrief }> {
  try {
    const { res, brief } = await getBriefCache(cid);
    if (brief && !includeLevels) {
      return { res, brief: { ...brief, levels: [] } };
    }
    return { res, brief };
  } catch (e) {
    console.error(e);
    return { res: { message: "internal server error", status: 500 } };
  }
}
