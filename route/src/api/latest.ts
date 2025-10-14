import { Hono } from "hono";
import { cache } from "hono/cache";
import { MongoClient } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed } from "./chart.js";
import { isSample } from "@falling-nikochan/chart";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";

const latestApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  cache({
    cacheName: "api-latest",
    cacheControl: "max-age=600",
  }),
  describeRoute({
    description:
      "Get the list of all charts that are published and not deleted. " +
      "Sorted by update timestamp in descending order.",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: resolver(v.array(v.object({ cid: v.string() }))),
          },
        },
      },
    },
  }),
  async (c) => {
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      return c.json(
        (
          await db
            .collection<ChartEntryCompressed>("chart")
            .find({ published: true, deleted: false })
            .sort({ updatedAt: -1 })
            // .limit(numLatest)
            .project<{ cid: string }>({ _id: 0, cid: 1 })
            .toArray()
        ).filter((e) => !isSample(e.cid)),
        200,
        {
          "cache-control": cacheControl(env(c), 600),
        }
      );
    } finally {
      await client.close();
    }
  }
);

export default latestApp;
