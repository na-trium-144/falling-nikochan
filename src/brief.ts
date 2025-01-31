import { entryToBrief, getChartEntry } from "./chart";
import { MongoClient } from "mongodb";
import "dotenv/config";
import { ChartBrief } from "@/chartFormat/chart";

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
  // todo
  // revalidateTag(`brief-${cid}`);
}

export async function getBrief(
  cid: string,
  includeLevels: boolean
): Promise<{ res?: { message: string; status: number }; brief?: ChartBrief }> {
  // const getBriefCache = unstable_cache(() => getBriefImpl(cid), [cid], {
  //   tags: [`brief-${cid}`],
  //   revalidate: false,
  // });
  try {
    const { res, brief } = await getBriefImpl(cid);
    if (brief && !includeLevels) {
      return { res, brief: { ...brief, levels: [] } };
    }
    return { res, brief };
  } catch (e) {
    console.error(e);
    return { res: { message: "internal server error", status: 500 } };
  }
}

export async function handleGetBrief(cid: string, includeLevels: boolean) {
  const { res, brief } = await getBrief(cid, includeLevels);
  if (brief) {
    return new Response(JSON.stringify(brief), {
      headers: {
        "cache-control": "max-age=3600",
      },
    });
  } else {
    return new Response(JSON.stringify({ message: res?.message }), {
      status: res?.status || 500,
      headers: {
        "cache-control": "max-age=3600",
      },
    });
  }
}
