import { Hono } from "hono";
import { backendOrigin, Bindings, cacheControl } from "./env.js";
import { env } from "hono/adapter";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "./api/chart.js";
import { isSample } from "@falling-nikochan/chart";
import xmlbuilder2 from "xmlbuilder2";

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
          }>({
            _id: 0,
            cid: 1,
            title: 1,
            composer: 1,
            chartCreator: 1,
            updatedAt: 1,
          })
          .toArray()
      ).filter((e) => !isSample(e.cid));

      // xmlbuilder2でRSS XMLを構築
      const doc = xmlbuilder2
        .create({ version: "1.0", encoding: "UTF-8" })
        .ele("rss", {
          version: "2.0",
          "xmlns:atom": "http://www.w3.org/2005/Atom",
        })
        .ele("channel");

      doc.ele("title").txt("Falling Nikochan - Latest Charts").up();
      doc.ele("link").txt(`${backendOrigin(c)}/main/play`).up();
      doc
        .ele("description")
        .txt("Latest rhythm game charts from Falling Nikochan")
        .up();
      doc.ele("language").txt("ja").up();

      // <atom:link ... />
      doc
        .ele("atom:link", {
          href: `${backendOrigin(c)}/rss.xml`,
          rel: "self",
          type: "application/rss+xml",
        })
        .up();

      // <item>群
      for (const chart of charts) {
        const item = doc.ele("item");

        item
          .ele("title")
          .txt(
            `${chart.title} - ${chart.composer} (Chart by ${chart.chartCreator})`
          )
          .up();

        item.ele("link").txt(`${backendOrigin(c)}/share/${chart.cid}`).up();

        item
          .ele("guid", { isPermaLink: "true" })
          .txt(`${backendOrigin(c)}/share/${chart.cid}`)
          .up();

        item.ele("pubDate").txt(new Date(chart.updatedAt).toUTCString()).up();

        item
          .ele("description")
          .txt(
            `${chart.title} by ${chart.composer} - Chart created by ${chart.chartCreator}`
          )
          .up();

        item.up(); // </item>
      }

      // channelまで上がってからXML化
      const rssXml = doc.up().up().end({ prettyPrint: true });

      return c.body(rssXml, 200, {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": cacheControl(env(c), CACHE_MAX_AGE),
      });
    } finally {
      await client.close();
    }
  }
);

export default rssApp;
