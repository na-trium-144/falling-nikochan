import { MongoClient } from "mongodb";
import {
  ChartEntryCompressed,
  entryToBrief,
  unzipEntry,
} from "../api/chart.js";
import { Bindings } from "../env.js";
import { postChart } from "./twitter.js";

const CHART_SCAN_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const CHART_POST_DELAY_MS = 15 * 60 * 1000;
const CHART_REPOST_COOLDOWN_MS = 72 * 60 * 60 * 1000;

export async function checkNewCharts(env: Bindings) {
  const client = new MongoClient(env.MONGODB_URI);
  let newCharts: ChartEntryCompressed[] = [];
  let updatedCharts: ChartEntryCompressed[] = [];
  const now = Date.now();

  try {
    await client.connect();
    const db = client.db("nikochan");

    // Fetch new charts
    newCharts = await Promise.all(
      (
        await db
          .collection<ChartEntryCompressed>("chart")
          .find({
            published: true,
            deleted: false,
            notifiedAt: { $exists: false },
            updatedAt: {
              $gte: now - CHART_SCAN_LOOKBACK_MS,
              $lte: now - CHART_POST_DELAY_MS,
            },
          })
          .toArray()
      ).map((compressed) => unzipEntry(compressed))
    );

    // Fetch updated charts
    updatedCharts = await Promise.all(
      (
        await db
          .collection<ChartEntryCompressed>("chart")
          .find({
            published: true,
            deleted: false,
            notifiedAt: { $lt: now - CHART_REPOST_COOLDOWN_MS },
            updatedAt: {
              $gte: now - CHART_SCAN_LOOKBACK_MS,
              $lte: now - CHART_POST_DELAY_MS,
            },
          })
          .toArray()
      )
        .filter(
          (chart) =>
            chart.updatedAt > chart.notifiedAt! + CHART_REPOST_COOLDOWN_MS
        )
        .map((compressed) => unzipEntry(compressed))
    );
  } finally {
    // Close the initial client
    await client.close();
  }

  // Process new charts
  for (const entry of newCharts) {
    console.log(`New chart found: ${entry.cid}`);
    const brief = entryToBrief(entry);
    const postResult = await postChart(env, entry.cid, brief, "new");
    console.log(postResult);

    if (postResult !== "error") {
      const newClient = new MongoClient(env.MONGODB_URI);
      try {
        await newClient.connect();
        const db = newClient.db("nikochan");
        await db
          .collection("chart")
          .updateOne({ cid: entry.cid }, { $set: { notifiedAt: now } });
      } finally {
        await newClient.close();
      }
    }
  }

  // Process updated charts
  for (const entry of updatedCharts) {
    console.log(`Updated chart found: ${entry.cid}`);
    const brief = entryToBrief(entry);
    const postResult = await postChart(env, entry.cid, brief, "update");
    console.log(postResult);

    if (postResult !== "error") {
      const newClient = new MongoClient(env.MONGODB_URI);
      try {
        await newClient.connect();
        const db = newClient.db("nikochan");
        await db
          .collection("chart")
          .updateOne({ cid: entry.cid }, { $set: { notifiedAt: now } });
      } finally {
        await newClient.close();
      }
    }
  }
}
