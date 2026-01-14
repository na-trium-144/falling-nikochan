import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  apiApp,
  ogApp,
  redirectApp,
  sitemapApp,
  rssApp,
  shareApp,
  Bindings,
  languageDetector,
  onError,
  notFound,
  fetchStatic,
  fetchBrief,
  cronTestApp,
} from "./src/index.js";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { ImageResponse } from "@vercel/og";
import { getConnInfo } from "@hono/node-server/conninfo";

const port = 8787;
console.log(`Server is running on http://localhost:${port}`);

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .use(logger())
  .route("/api", await apiApp({ getConnInfo }))
  .route(
    "/og",
    ogApp({
      ImageResponse,
      fetchBrief: fetchBrief({ fetchStatic }),
      fetchStatic,
    })
  )
  .route("/cron", cronTestApp)
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
  .use(
    "/*",
    serveStatic({
      root: "../frontend/out",
      rewriteRequestPath: (path) => {
        if (path.match(/\/[^/]+\.[^/]+$/)) {
          // path with extension
          return path;
        } else if (path.endsWith("/")) {
          return path.slice(0, -1) + ".html";
        } else {
          return path + ".html";
        }
      },
    })
  )
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

serve({
  fetch: app.fetch,
  port,
});
