import {
  apiApp,
  redirectApp,
  sitemapApp,
  rssApp,
  shareApp,
  languageDetector,
  onError,
  notFound,
  fetchBrief,
  reportPopularCharts,
  checkNewCharts,
  reportToDiscord,
} from "@falling-nikochan/route";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { getConnInfo } from "hono/cloudflare-workers";

const fetchStatic = (e, url) => e.ASSETS.fetch(url);

const app = new Hono({ strict: false })
  .route("/api", await apiApp({ getConnInfo }))
  .get("/og/*", (c) => {
    const url = new URL(c.req.raw.url);
    return c.redirect(
      env(c).BACKEND_OG_PREFIX + url.pathname + url.search,
      307
    );
  })
  .route("/sitemap.xml", sitemapApp)
  .route("/rss.xml", rssApp)
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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // オリジン（DNSで設定したサーバー）に丸投げする
    if (
      url.hostname === "nikochan.utcode.net" &&
      (url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/og/") ||
        url.pathname.startsWith("/sitemap.xml") ||
        url.pathname.startsWith("/share/"))
    ) {
      // fetch(request) と書くだけで、Workerを通さずオリジンにリクエストが飛びます
      try {
        const res = await fetch(request.clone());
        if (res.status < 500) {
          return res;
        } else {
          console.log(
            "passthrough request returned:",
            res.status,
            await res.text()
          );
        }
      } catch (e) {
        console.log("passthrough request failed:", e);
        // passthrough
      }
    }

    return app.fetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          await reportPopularCharts(env);
        } catch (e) {
          await reportToDiscord(
            env,
            "Uncaught exception in reportPopularCharts():\n" + String(e)
          );
        }
        try {
          await checkNewCharts(env);
        } catch (e) {
          await reportToDiscord(
            env,
            "Uncaught exception in checkNewCharts():\n" + String(e)
          );
        }
      })()
    );
  },
};
