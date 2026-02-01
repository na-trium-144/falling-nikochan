import { Hono } from "hono";
import { Bindings, cacheControl } from "./env.js";
import { env } from "hono/adapter";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "./api/chart.js";
import { isSample } from "@falling-nikochan/chart";

// Cache duration for RSS feed (in seconds) - 30 minutes
const CACHE_MAX_AGE = 1800;
// Number of items to include in RSS feed
const RSS_ITEM_LIMIT = 25;

const rssApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  async (c) => {
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      
      const charts = (
        await db
          .collection<ChartEntryCompressed>("chart")
          .find({ published: true, deleted: false })
          .sort({ updatedAt: -1 })
          .limit(RSS_ITEM_LIMIT)
          .project<{
            cid: string;
            title: string;
            composer: string;
            chartCreator: string;
            updatedAt: number;
            ytId: string;
          }>({ 
            _id: 0, 
            cid: 1, 
            title: 1, 
            composer: 1, 
            chartCreator: 1, 
            updatedAt: 1, 
            ytId: 1 
          })
          .toArray()
      ).filter((e) => !isSample(e.cid));

      // Generate RSS XML
      const baseUrl = "https://nikochan.utcode.net";
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Falling Nikochan - Latest Charts</title>
    <link>${baseUrl}/main/play</link>
    <description>Latest rhythm game charts from Falling Nikochan</description>
    <language>ja</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${charts
  .map(
    (chart) => `    <item>
      <title>${escapeXml(chart.title)} - ${escapeXml(chart.composer)} (Chart by ${escapeXml(chart.chartCreator)})</title>
      <link>${baseUrl}/share/${chart.cid}</link>
      <guid isPermaLink="true">${baseUrl}/share/${chart.cid}</guid>
      <pubDate>${new Date(chart.updatedAt).toUTCString()}</pubDate>
      <description>${escapeXml(`${chart.title} by ${chart.composer} - Chart created by ${chart.chartCreator}`)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

      return c.body(rssXml, 200, {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": cacheControl(env(c), CACHE_MAX_AGE),
      });
    } finally {
      await client.close();
    }
  }
);

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default rssApp;
