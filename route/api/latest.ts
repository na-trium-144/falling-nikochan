import { Hono } from "hono";
import { MongoClient } from "mongodb";
import { Bindings } from "../env";
import { env } from "hono/adapter";

export const numLatest = 25;

const latestApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  async (c) => {
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      return c.json(
        await db
          .collection("chart")
          .find({ published: true })
          .sort({ updatedAt: -1 })
          .limit(numLatest)
          .project({ _id: 0, cid: 1 })
          .toArray(),
        200,
        {
          "cache-control": "max-age=600",
        }
      );
    } finally {
      await client.close();
    }
  }
);

export default latestApp;
