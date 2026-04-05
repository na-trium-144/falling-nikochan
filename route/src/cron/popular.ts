import { MongoClient } from "mongodb";
import { Bindings } from "../env.js";
import {
  ChartEntryCompressed,
  ChartLevelBrief,
  entryToBrief,
  getChartEntryCompressed,
} from "../api/chart.js";
import { ChartBrief } from "@falling-nikochan/chart";
import { postPopular } from "./twitter.js";
import { aggeratePopularCounts, getRawPopularCounts } from "../api/search.js";

export async function reportPopularCharts(env: Bindings) {
  const client = new MongoClient(env.MONGODB_URI);
  let popularBriefs: ChartBrief[];
  try {
    await client.connect();
    const db = client.db("nikochan");
    const lastReportedAt = await db
      .collection<{ popularReportedAt: number }>("meta")
      .findOne({}, { projection: { _id: 0, popularReportedAt: 1 } });
    if (
      lastReportedAt &&
      (Date.now() - lastReportedAt.popularReportedAt <
        1000 * 60 * 60 * (24 * 2 + 12) ||
        (new Date().getUTCHours() + 9) % 24 < 17)
    ) {
      console.log(
        "Popular charts have been reported within the last 3 days. Skipping."
      );
      return;
    } else {
      const rawPopularCounts = await getRawPopularCounts(db);
      const results = await db
        .collection<ChartEntryCompressed>("chart")
        .find({ published: true, deleted: false })
        .project<{
          cid: string;
          levelBrief: ChartLevelBrief[];
        }>({
          _id: 0,
          cid: 1,
          levelBrief: 1,
        })
        .toArray();
      const sortedResults = results
        .map((r) => ({
          cid: r.cid,
          count: aggeratePopularCounts(rawPopularCounts, r),
        }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      popularBriefs = await Promise.all(
        sortedResults.map(async ({ cid }) =>
          getChartEntryCompressed(db, cid, null).then((entry) =>
            entryToBrief(entry)
          )
        )
      );

      // postPopularがerrorを出して次のcronで再試行したい可能性よりも、
      // postPopular後にmongodbへの再接続に失敗するケースの方が多いので、
      // 後者を優先してここで書き込み
      await db
        .collection("meta")
        .updateOne(
          {},
          { $set: { popularReportedAt: Date.now() } },
          { upsert: true }
        );
    }
  } finally {
    // Close the initial MongoClient before calling postPopular
    await client.close();
  }

  await postPopular(env, popularBriefs.slice(0, 6));
}
