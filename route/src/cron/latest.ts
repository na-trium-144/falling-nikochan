import { MongoClient } from "mongodb";
import {
  ChartEntryCompressed,
  entryToBrief,
  unzipEntry,
} from "../api/chart.js";
import { Bindings } from "../env.js";
import { postChart } from "./twitter.js";

export async function checkNewCharts(env: Bindings) {
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    // まだ通知したことがなく、今から24h以内に更新されている
    const newCharts = await Promise.all(
      (
        await db
          .collection<ChartEntryCompressed>("chart")
          .find({
            published: true,
            deleted: false,
            notifiedAt: { $exists: false },
            updatedAt: {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).getTime(),
            },
          })
          .toArray()
      ).map((compressed) => unzipEntry(compressed))
    );
    // 最後の通知から12h以上後に更新されている
    const updatedCharts = await Promise.all(
      (
        await db
          .collection<ChartEntryCompressed>("chart")
          .find({
            published: true,
            deleted: false,
            notifiedAt: { $exists: true },
            $expr: {
              $gt: [
                "$updatedAt",
                { $add: ["$notifiedAt", 12 * 60 * 60 * 1000] },
              ],
            },
          })
          .toArray()
      ).map((compressed) => unzipEntry(compressed))
    );
    for (const entry of newCharts) {
      console.log(`New chart found: ${entry.cid}`);
      try {
        const brief = entryToBrief(entry);
        await postChart(env, entry.cid, brief, "new");
        await db
          .collection("chart")
          .updateOne({ cid: entry.cid }, { $set: { notifiedAt: Date.now() } });
      } catch (e) {
        console.error(`Failed to post new chart ${entry.cid}:`, e);
      }
    }
    for (const entry of updatedCharts) {
      console.log(`Updated chart found: ${entry.cid}`);
      try {
        const brief = entryToBrief(entry);
        await postChart(env, entry.cid, brief, "update");
        await db
          .collection("chart")
          .updateOne({ cid: entry.cid }, { $set: { notifiedAt: Date.now() } });
      } catch (e) {
        console.error(`Failed to post updated chart ${entry.cid}:`, e);
      }
    }
  } finally {
    await client.close();
  }
}
