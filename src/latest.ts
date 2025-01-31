import { MongoClient } from "mongodb";

export const numLatest = 25;

export function revalidateLatest() {
  console.warn(`revalidate latest`);
  // todo
  // revalidateTag(`latest`);
}

export async function handleGetLatest(env: Env) {
  console.log("getLatestImpl");
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const latest = await db
      .collection("chart")
      .find({ published: true })
      .sort({ updatedAt: -1 })
      .limit(numLatest)
      .project({ _id: 0, cid: 1 })
      .toArray();
    console.log(latest);
    return new Response(JSON.stringify(latest));
  } finally {
    await client.close();
  }
}
