import {
  apiApp,
  redirectApp,
  sitemapApp,
  shareApp,
  languageDetector,
  languageParser,
  onError,
  notFound,
  fetchBrief,
} from "@falling-nikochan/route";
import { Hono } from "hono";
import { env } from "hono/adapter";

const fetchStatic = (e, url) => e.ASSETS.fetch(url);

const app = new Hono({ strict: false })
  .route("/api", apiApp)
  .get("/og/*", (c) => {
    const url = new URL(c.req.raw.url);
    return c.redirect(
      env(c).BACKEND_OG_PREFIX + url.pathname + url.search,
      307
    );
  })
  .route("/sitemap.xml", sitemapApp)
  .route(
    "/share",
    shareApp({
      fetchBrief: fetchBrief({ fetchStatic }),
      fetchStatic,
    })
  )
  .route("/", redirectApp({ fetchStatic }))
  .use(languageDetector())
  .use(languageParser())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

export default app;
