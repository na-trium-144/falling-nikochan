import { Hono, MiddlewareHandler } from "hono";
import { backendOrigin, Bindings, cacheControl } from "./env.js";
import { env } from "hono/adapter";
import { ChartEntryCompressed } from "./api/chart.js";
import xmlbuilder2 from "xmlbuilder2";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import { Db } from "mongodb";
import { cache } from "hono/cache";

// Cache duration for RSS feed (in seconds) - 30 minutes
const CACHE_MAX_AGE = 1800;
// Number of items to include in RSS feed
const RSS_ITEM_LIMIT = 25;

const rssApp = async (config: { dbMiddleware: MiddlewareHandler }) =>
  new Hono<{ Bindings: Bindings; Variables: { db: () => Promise<Db> } }>({
    strict: false,
  }).get(
    "/",
    cache({
      cacheName: "rss",
    }),
    config.dbMiddleware,
    async (c) => {
      const t = await getTranslations("en", "share");

      const db = await c.get("db")();
      const charts = await db
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
        .toArray();

      // xmlbuilder2でRSS XMLを構築
      const doc = xmlbuilder2
        .create({ version: "1.0", encoding: "UTF-8" })
        .ele("rss", {
          version: "2.0",
          "xmlns:atom": "http://www.w3.org/2005/Atom",
        })
        .ele("channel");

      doc.ele("title").txt("Falling Nikochan - Latest Charts").up();
      doc.ele("link").txt(backendOrigin(c)).up();
      doc
        .ele("description")
        .txt(
          "Simple and cute rhythm game, where anyone can create and share charts."
        )
        .up();

      const images = doc.ele("image");
      images
        .ele("url")
        .txt(`${backendOrigin(c)}/assets/icon.png`)
        .up();
      images.ele("title").txt("Falling Nikochan").up();
      images.ele("link").txt(backendOrigin(c)).up();
      images.up();

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
        const newTitle = chart.composer
          ? t("titleWithComposer", {
              title: chart.title,
              composer: chart.composer,
              cid: chart.cid,
            })
          : t("title", {
              title: chart.title,
              cid: chart.cid,
            });
        const newDescription = t("description", {
          chartCreator: chart.chartCreator || t("chartCreatorEmpty"),
          title: chart.title,
        });

        item.ele("title").txt(newTitle).up();
        item
          .ele("link")
          .txt(`${backendOrigin(c)}/share/${chart.cid}`)
          .up();
        item
          .ele("guid", { isPermaLink: "true" })
          .txt(`${backendOrigin(c)}/share/${chart.cid}`)
          .up();
        item.ele("pubDate").txt(new Date(chart.updatedAt).toUTCString()).up();
        item.ele("description").txt(newDescription).up();
        item.up(); // </item>
      }

      // channelまで上がってからXML化
      const rssXml = doc.up().up().end({ prettyPrint: true });

      return c.body(rssXml, 200, {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": cacheControl(env(c), CACHE_MAX_AGE),
      });
    }
  );

export default rssApp;
