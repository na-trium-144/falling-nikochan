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
            $where: function () {
              return (
                this.notifiedAt !== undefined &&
                this.updatedAt > this.notifiedAt + 12 * 60 * 60 * 1000
              );
            },
          })
          .toArray()
      ).map((compressed) => unzipEntry(compressed))
    );
    for (const entry of newCharts) {
      console.log(`New chart found: ${entry.cid}`);
      const brief = entryToBrief(entry);
      const postResult = await postChart(env, entry.cid, brief, "new");
      console.log(postResult);
      if (postResult !== "error") {
        await db
          .collection("chart")
          .updateOne({ cid: entry.cid }, { $set: { notifiedAt: Date.now() } });
      }
    }
    for (const entry of updatedCharts) {
      console.log(`Updated chart found: ${entry.cid}`);
      const brief = entryToBrief(entry);
      const postResult = await postChart(env, entry.cid, brief, "update");
      console.log(postResult);
      if (postResult !== "error") {
        await db
          .collection("chart")
          .updateOne({ cid: entry.cid }, { $set: { notifiedAt: Date.now() } });
      }
    }
  } finally {
    await client.close();
  }
}
