import { MongoClient } from "mongodb";
import { Bindings } from "../env.js";
import { CidCount, getPopularCharts } from "../api/popular.js";
import { entryToBrief, getChartEntryCompressed } from "../api/chart.js";
import { ChartBrief } from "@falling-nikochan/chart";
import { postPopular } from "./twitter.js";

export async function reportPopularCharts(env: Bindings) {
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const lastReportedAt = await db
      .collection<{ popularReportedAt: number }>("meta")
      .findOne({}, { projection: { _id: 0, popularReportedAt: 1 } });
    if (
      lastReportedAt &&
      Date.now() - lastReportedAt.popularReportedAt <
        1000 * 60 * 60 * (24 * 2 + 12) &&
      (new Date().getUTCHours() + 9) % 24 < 17
    ) {
      console.log(
        "Popular charts have been reported within the last 3 days. Skipping."
      );
      return;
    } else {
      const popularCids: CidCount[] = await getPopularCharts(db);
      const popularBriefs: ChartBrief[] = await Promise.all(
        popularCids.map(async ({ cid }) =>
          getChartEntryCompressed(db, cid, null).then((entry) =>
            entryToBrief(entry)
          )
        )
      );
      const result = await postPopular(env, popularBriefs.slice(0, 6));
      if (result !== "error") {
        await db
          .collection("meta")
          .updateOne(
            {},
            { $set: { popularReportedAt: Date.now() } },
            { upsert: true }
          );
      }
    }
  } finally {
    await client.close();
  }
}
