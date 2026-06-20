import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import {
  unzipEntry,
  entryToChart,
  ChartEntryCompressed,
} from "./src/api/chart";
import { validateChart } from "@falling-nikochan/chart";

dotenv.config({ path: join(dirname(process.cwd()), ".env") });

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

const client = new MongoClient(process.env.MONGODB_URI);

async function run() {
  try {
    await client.connect();
    const db = client.db("nikochan");

    console.log("Fetching charts with version 16...");
    const cursor = db.collection<ChartEntryCompressed>("chart").find({});

    const invalidCids: string[] = [];
    let count = 0;

    for await (const doc of cursor) {
      count++;
      try {
        const entry = await unzipEntry(doc);
        const chart = entryToChart(entry);
        await validateChart(chart);
      } catch (e) {
        console.error(`Validation failed for cid: ${doc.cid}. Error:`, e);
        invalidCids.push(doc.cid);
      }
    }

    console.log(`\nProcessed ${count} chart(s) with ver 16.`);
    console.log("--- Validation Results ---");
    if (invalidCids.length > 0) {
      console.log(`Found ${invalidCids.length} invalid chart(s):`);
      console.log(invalidCids.join(", "));
    } else {
      console.log("All checked ver 16 charts are valid.");
    }
  } catch (e) {
    console.error("An error occurred during script execution:", e);
  } finally {
    await client.close();
  }
}

run();
