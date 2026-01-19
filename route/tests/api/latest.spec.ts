import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyCid, initDb } from "./init";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";

describe("GET /api/latest", () => {
  test("should return latest entries", async () => {
    await initDb();
    const res = await app.request("/api/latest");
    expect(res.status).to.equal(200);
    const entries: { cid: string }[] = await res.json();
    expect(entries.length).to.be.at.most(25);
    for (const entry of entries) {
      expect(entry.cid).to.be.a("string");
    }

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      await db.collection<ChartEntryCompressed>("chart").updateOne(
        { cid: dummyCid },
        {
          $set: {
            updatedAt: new Date().getTime(),
            published: true,
          },
        }
      );
    } finally {
      await client.close();
    }

    const res2 = await app.request("/api/latest");
    expect(res2.status).to.equal(200);
    const entries2: { cid: string }[] = await res2.json();
    expect(entries2.length).to.be.at.most(25);
    expect(entries2[0]).to.deep.equal({
      cid: dummyCid,
    });
  });
});
