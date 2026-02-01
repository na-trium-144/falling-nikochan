import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "./src/api/chart";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

const client = new MongoClient(process.env.MONGODB_URI!);
try {
  await client.connect();
  const db = client.db("nikochan");
  for await (const chart of db.collection<ChartEntryCompressed>("chart").find({
    notifiedAt: { $exists: false },
    published: true,
  })) {
    console.log(`Updating ${chart.cid}`);
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: chart.cid },
      {
        $set: {
          notifiedAt: 0,
        },
      }
    );
  }
} finally {
  await client.close();
}
