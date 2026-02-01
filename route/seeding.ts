import { ChartEntryCompressed, chartToEntry, zipEntry } from "./src/api/chart";
// import YAML from "yaml";
import msgpack from "@msgpack/msgpack";
import { readdir, readFile } from "node:fs/promises";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import {
  getTimeSec,
  levelTypesConst,
  NoteCommand,
  SpeedChangeWithLua,
  Chart5,
} from "@falling-nikochan/chart";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

if (typeof process.env.MONGODB_URI !== "string") {
  throw new Error("MONGODB_URI is not set");
}
if (/[a-z]\.[a-z]/.test(process.env.MONGODB_URI)) {
  throw new Error("MONGODB_URI seems to be a production database.");
}

const client = new MongoClient(process.env.MONGODB_URI);
const pSecretSalt = process.env.SECRET_SALT || "SecretSalt";
try {
  await client.connect();
  const db = client.db("nikochan");
  for (const file of await readdir("./samples")) {
    const cid = file.split(".")[0];
    const content: Chart5 = msgpack.decode(await readFile("./samples/" + file));
    await db.collection<ChartEntryCompressed>("chart").updateOne(
      { cid },
      {
        $set: await zipEntry({
          ...(await chartToEntry(
            {
              ...content,
              ver: content.ver as 13,
              levels: content.levels.map((l) => ({
                ...l,
                notes: l.notes as NoteCommand[],
                speedChanges: l.speedChanges as SpeedChangeWithLua[],
                type: l.type as (typeof levelTypesConst)[number],
                unlisted: false,
                ytBegin: 0,
                ytEnd: "note",
                ytEndSec:
                  l.notes.length >= 1
                    ? getTimeSec(
                        l.bpmChanges,
                        l.notes[l.notes.length - 1].step
                      ) + content.offset
                    : 0,
              })),
              changePasswd: "p",
              published: true,
              locale: "ja",
              copyBuffer: [],
            },
            cid,
            Date.now(),
            null,
            undefined,
            pSecretSalt,
            null
          )),
        }),
      },
      { upsert: true }
    );
    console.log(`Inserted chart ${cid} (version: ${content.ver})`);
  }
} finally {
  await client.close();
}
