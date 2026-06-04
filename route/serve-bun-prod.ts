import { serveStatic } from "hono/bun";
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
} from "./src/index.js";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { ImageResponse } from "@vercel/og";
import { getConnInfo } from "hono/bun";
import * as Sentry from "@sentry/hono/bun";
import packageJson from "./package.json" with { type: "json" };

const port = 8787;

const app = new Hono<{ Bindings: Bindings }>({ strict: false });
app.use(
  Sentry.sentry(app, {
    dsn: process.env.SENTRY_DSN,
    release: `${packageJson.version}-bun`,
    sendDefaultPii: false,
    integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
  })
);
app
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
      root: "./frontend/out",
      rewriteRequestPath: (path) => {
        if (path.match(/\/[^/]+\.[^/]+$/)) {
          // path with extension
          return path;
        } else if (path.endsWith("/")) {
          return path.slice(0, -1) + ".html";
        } else if (path.endsWith("LICENSE")) {
          return path;
        } else {
          // access to html file without extension
          return path + ".html";
        }
      },
    })
  )
  .use(languageDetector())
  .onError(
    onError({
      fetchStatic,
      captureException: Sentry.captureException,
    })
  )
  .notFound(notFound);

export default {
  port: port,
  fetch: app.fetch,
  idleTimeout: 255,
};
