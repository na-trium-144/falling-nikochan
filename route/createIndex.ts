import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "./src/api/chart";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { inspect } from "node:util";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });
inspect.defaultOptions.depth = null;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

const client = new MongoClient(process.env.MONGODB_URI!);
try {
  await client.connect();
  const db = client.db("nikochan");

  // chart
  await db.collection("chart").createIndex({ cid: 1 });
  await db
    .collection("chart")
    .createIndex({ published: 1, deleted: 1, updatedAt: -1 });
  await db
    .collection("chart")
    .createIndex({ "levelBrief.difficulty": 1, "levelBrief.unlisted": 1 });

  // rateLimit
  await db.collection("rateLimit").createIndex({ ip: 1 });

  // playRecord
  await db.collection("playRecord").createIndex({ cid: 1 });
  await db.collection("playRecord").createIndex({ playedAt: 1, editing: 1 });

  // ytData
  await db.collection("ytData").createIndex({ ytId: 1 });

  console.log(
    await db
      .collection<ChartEntryCompressed>("chart")
      .find({
        cid: "602399",
      })
      .explain()
  );
} finally {
  await client.close();
}
