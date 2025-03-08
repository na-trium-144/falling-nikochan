import { expect, test, describe } from "bun:test";
import { dummyCid, initDb } from "./init";
import app from "@falling-nikochan/route";
import { validCId } from "@falling-nikochan/chart";
import { MongoClient } from "mongodb";

describe("GET /api/latest", () => {
  test("should return latest entries", async () => {
    await initDb();
    const res = await app.request("/api/latest");
    expect(res.status).toBe(200);
    const entries: { cid: string }[] = await res.json();
    expect(entries.length).toBeLessThanOrEqual(25);
    for (const entry of entries) {
      expect(entry).toStrictEqual({
        cid: expect.any(String),
      });
      expect(validCId(entry.cid)).toBe(true);
    }

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      await db.collection("chart").updateOne(
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
    expect(res2.status).toBe(200);
    const entries2: { cid: string }[] = await res2.json();
    expect(entries2.length).toBeLessThanOrEqual(25);
    expect(entries2[0]).toStrictEqual({
      cid: dummyCid,
    });
  });
});
