import {
  apiApp,
  redirectApp,
  sitemapApp,
  shareApp,
  languageDetector,
  onError,
  notFound,
  fetchBrief,
  reportPopularCharts,
  checkNewCharts,
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
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

export default {
  fetch: app.fetch,
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(reportPopularCharts(env).then(() => checkNewCharts(env)));
  },
};
