import { Hono, MiddlewareHandler } from "hono";
import { Bindings, cacheControl } from "./env.js";
import { SitemapItemLoose, SitemapStream } from "sitemap";
import { Readable } from "node:stream";
import { env } from "hono/adapter";
import { ChartEntryCompressed } from "./api/chart.js";
import { text } from "node:stream/consumers";
import { Db } from "mongodb";

const staticSitemapItems: SitemapItemLoose[] = [
  { url: "/", priority: 1 },
  { url: "/api" },
  // {url: "/edit", priority: 0},
  { url: "/main/about" },
  { url: "/main/edit" },
  // { url: "/main/links", priority: 0 },
  { url: "/main/play" },
  { url: "/main/policies" },
  // {url: "/main/shareInternal", priority: 0,},
  { url: "/main/version" },
  // {url: "/play", priority: 0,},
];

const sitemapApp = async (config: { dbMiddleware: MiddlewareHandler }) =>
  new Hono<{ Bindings: Bindings; Variables: { db: Db } }>({
    strict: false,
  }).get("/", config.dbMiddleware, async (c) => {
    let allCharts: SitemapItemLoose[];
    const db = c.get("db");
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

    const smStream = new SitemapStream({
      hostname: "https://nikochan.utcode.net/",
    });
    Readable.from(staticSitemapItems.concat(allCharts)).pipe(smStream);
    // smStream.end();
    return c.body(await text(smStream), 200, {
      "Content-Type": "application/xml",
      "Cache-Control": cacheControl(env(c), 86400),
    });
  });

export default sitemapApp;
