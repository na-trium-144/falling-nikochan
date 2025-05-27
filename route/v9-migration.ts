import { Binary, MongoClient } from "mongodb";
import { ChartEntryCompressed, getPServerHash } from "./src/api/chart";
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

interface ChartEntryCompressedV8 {
  cid: string;
  levelsCompressed: Binary | null;
  deleted: boolean;
  published: boolean;
  ver: 4 | 5 | 6 | 7 | 8;
  offset: number;
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  editPasswd: string;
  updatedAt: number;
  playCount: number;
  locale?: string; // new in v7
  levelBrief: {
    name: string;
    hash: string;
    type: string;
    difficulty: number;
    noteCount: number;
    bpmMin: number;
    bpmMax: number;
    length: number;
    unlisted: boolean;
  }[];
}

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}
if (!process.env.SECRET_SALT) {
  throw new Error("SECRET_SALT is not set");
}

const client = new MongoClient(process.env.MONGODB_URI!);
try {
  await client.connect();
  const db = client.db("nikochan");
  for await (const chart of db
    .collection<ChartEntryCompressedV8>("chart")
    .find({})) {
    if (
      chart.ver >= 9 ||
      "pServerHash" in chart ||
      "pRandomSalt" in chart ||
      "ip" in chart
    ) {
      throw new Error("Already migrated");
    }
    const pRandomSalt = randomBytes(16).toString("base64");
    const pServerHash = await getPServerHash(
      chart.cid,
      chart.editPasswd,
      process.env.SECRET_SALT!,
      pRandomSalt
    );
    console.log(`Updating ${chart.cid}`);
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid: chart.cid },
      {
        $set: {
          pServerHash: chart.editPasswd ? pServerHash : null,
          pRandomSalt: chart.editPasswd ? pRandomSalt : null,
          ip: [],
          locale: chart.locale || "ja",
        },
        $unset: {
          editPasswd: "",
        },
      }
    );
  }
} finally {
  await client.close();
}
