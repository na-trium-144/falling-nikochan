import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "./src/api/chart";
import { getYTDataEntry, normalizeEntry } from "./src/api/ytData";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set");
}
const client = new MongoClient(process.env.MONGODB_URI!);
try {
  await client.connect();
  const db = client.db("nikochan");
  for await (const chart of db
    .collection<ChartEntryCompressed>("chart")
    .find({})) {
    console.log(`Updating ${chart.cid}`);
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: chart.cid },
      {
        $set: {
          normalizedText: normalizeEntry({
            title: chart.title,
            composer: chart.composer,
            chartCreator: chart.chartCreator,
            ytData: await getYTDataEntry(process.env as any, db, chart.ytId),
          }),
        },
      }
    );
  }
} finally {
  await client.close();
}
