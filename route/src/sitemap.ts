import { Hono } from "hono";
import { Bindings, cacheControl } from "./env.js";
import { SitemapItemLoose, SitemapStream } from "sitemap";
import { Readable } from "node:stream";
import { env } from "hono/adapter";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "./api/chart.js";
import { text } from "node:stream/consumers";

const staticSitemapItems: SitemapItemLoose[] = [
  { url: "/", priority: 1 },
  { url: "/api" },
  // {url: "/edit", priority: 0},
  { url: "/main/about/1" },
  { url: "/main/about/2" },
  { url: "/main/about/3" },
  { url: "/main/about/4" },
  { url: "/main/about/5" },
  { url: "/main/edit" },
  { url: "/main/latest", priority: 0.3 },
  { url: "/main/links" },
  { url: "/main/play" },
  { url: "/main/policies" },
  { url: "/main/popular", priority: 0.3 },
  { url: "/main/recent", priority: 0.3 },
  // {url: "/main/shareInternal", priority: 0,},
  { url: "/main/version" },
  // {url: "/play", priority: 0,},
];

const sitemapApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  async (c) => {
    const client = new MongoClient(env(c).MONGODB_URI);
    let allCharts: SitemapItemLoose[];
    try {
      await client.connect();
      const db = client.db("nikochan");
      allCharts = (
        await db
          .collection<ChartEntryCompressed>("chart")
          .find({ published: true })
          .project<{
            cid: string;
            updatedAt: number;
          }>({ _id: 0, cid: 1, updatedAt: 1 })
          .toArray()
      ).map((c) => ({
        url: `/share/${c.cid}`,
        priority: 0.8,
        lastmod: new Date(c.updatedAt).toISOString(),
      }));
    } finally {
      await client.close();
    }

    const smStream = new SitemapStream({
      hostname: "https://nikochan.utcode.net/",
    });
    Readable.from(staticSitemapItems.concat(allCharts)).pipe(smStream);
    // smStream.end();
    return c.body(await text(smStream), 200, {
      "Content-Type": "application/xml",
      "Cache-Control": cacheControl(env(c), 86400),
    });
  }
);

export default sitemapApp;
