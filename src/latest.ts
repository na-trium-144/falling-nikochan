import { MongoClient } from "mongodb";
import "dotenv/config";

export const numLatest = 25;

async function getLatestImpl() {
  console.log("getLatestImpl");
  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("nikochan");
    return await db
      .collection("chart")
      .find({ published: true })
      .sort({ updatedAt: -1 })
      .limit(numLatest)
      .project({ _id: 0, cid: 1 })
      .toArray();
  } finally {
    await client.close();
  }
}
export function revalidateLatest() {
  console.warn(`revalidate latest`);
  // todo
  // revalidateTag(`latest`);
}

export async function getLatest() {
  // const getLatestCache = unstable_cache(getLatestImpl, [], {
  //   tags: ["latest"],
  //   revalidate: false,
  // });
  // return await getLatestCache();
  return await getLatestImpl();
}

export async function handleGetLatest() {
  const latest = await getLatest();
  console.log(latest);
  return new Response(JSON.stringify(latest), {
    headers: {
      "cache-control": "max-age=3600",
    },
  });
}
