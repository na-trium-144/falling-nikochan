import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  apiApp,
  ogApp,
  redirectApp,
  sitemapApp,
  shareApp,
  Bindings,
  languageDetector,
  languageParser,
  onError,
  notFound,
  fetchStatic,
  fetchBrief,
} from "./src/index.js";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { ImageResponse } from "@vercel/og";

const port = 8787;
console.log(`Server is running on http://localhost:${port}`);

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .use(logger())
  .route("/api", apiApp)
  .route(
    "/og",
    ogApp({
      ImageResponse,
      fetchBrief: fetchBrief({ fetchStatic }),
      fetchStatic,
    })
  )
  .route("/sitemap.xml", sitemapApp)
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
  .use(languageParser())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

serve({
  fetch: app.fetch,
  port,
});
