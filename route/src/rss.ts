import { Hono } from "hono";
import { Bindings, cacheControl } from "./env.js";
import { env } from "hono/adapter";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "./api/chart.js";
import { isSample } from "@falling-nikochan/chart";
import RSS from "rss";

// Cache duration for RSS feed (in seconds)
const CACHE_MAX_AGE = 1800;

// Number of latest items to include in RSS feed
const RSS_ITEM_LIMIT = 25;

const rssApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  async (c) => {
    const client = new MongoClient(env(c).MONGODB_URI);
    let latestCharts: ChartEntryCompressed[];
    try {
      await client.connect();
      const db = client.db("nikochan");
      latestCharts = await db
        .collection<ChartEntryCompressed>("chart")
        .find({ published: true, deleted: false })
        .sort({ updatedAt: -1 })
        .limit(RSS_ITEM_LIMIT)
        .project<ChartEntryCompressed>({
          _id: 0,
          cid: 1,
          title: 1,
          composer: 1,
          chartCreator: 1,
          ytId: 1,
          updatedAt: 1,
        })
        .toArray();
    } finally {
      await client.close();
    }

    // Filter out sample charts
    const filteredCharts = latestCharts.filter((e) => !isSample(e.cid));

    const feed = new RSS({
      title: "Falling Nikochan - Latest Charts",
      description:
        "Latest published charts from Falling Nikochan, a simple and cute rhythm game where anyone can create and share charts.",
      feed_url: "https://nikochan.utcode.net/rss.xml",
      site_url: "https://nikochan.utcode.net/",
      language: "ja",
      pubDate: filteredCharts.length > 0
        ? new Date(filteredCharts[0].updatedAt)
        : new Date(),
    });

    for (const chart of filteredCharts) {
      feed.item({
        title: chart.title || "Untitled",
        description: `${chart.composer ? `Composer: ${chart.composer}` : ""}${
          chart.composer && chart.chartCreator ? " | " : ""
        }${chart.chartCreator ? `Chart by: ${chart.chartCreator}` : ""}`,
        url: `https://nikochan.utcode.net/share/${chart.cid}`,
        guid: chart.cid,
        date: new Date(chart.updatedAt),
      });
    }

    const xml = feed.xml({ indent: true });

    return c.body(xml, 200, {
      "Content-Type": "application/rss+xml; charset=UTF-8",
      "Cache-Control": cacheControl(env(c), CACHE_MAX_AGE),
    });
  }
);

export default rssApp;
