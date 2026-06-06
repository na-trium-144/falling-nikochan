// ファイル名が api/index.ts でないとvercelは認識してくれない
// すべてのimportの拡張子に .js がついていないとvercelは認識してくれない

import { handle } from "hono/vercel";
import {
  apiApp,
  ogApp,
  sitemapApp,
  rssApp,
  shareApp,
  redirectApp,
  languageDetector,
  onError,
  notFound,
  fetchStatic,
  fetchBrief,
} from "@falling-nikochan/route";
import { Hono } from "hono";
import { ImageResponse } from "@vercel/og";
import { getConnInfo } from "hono/vercel";
import { compress } from "hono/compress";
import * as Sentry from "@sentry/hono/node";
import packageJson from "@falling-nikochan/route/package.json" with { type: "json" };

// export const config = {
//   runtime: "nodejs",
// };

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: `${packageJson.version}-v-${process.env.VERCEL_URL.replace(".vercel.app", "")}`,
  environment: process.env.VERCEL_TARGET_ENV,
  sendDefaultPii: false,
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
  includeLocalVariables: true,
});
const sentryMiddleware = (app) =>
  Sentry.sentry(app, { shouldHandleError: () => false });

const app = new Hono({ strict: false });
app.use(sentryMiddleware(app));
app
  .use(compress())
  .route("/api", await apiApp({ getConnInfo }))
  .route("/og", ogApp({ ImageResponse, fetchBrief, fetchStatic }))
  .route("/sitemap.xml", sitemapApp)
  .route("/rss.xml", rssApp)
  .route("/share", shareApp({ fetchBrief, fetchStatic }))
  .route("/", redirectApp({ fetchStatic }))
  .use(languageDetector())
  .onError(
    onError({
      fetchStatic,
      captureException: Sentry.captureException,
      setTransactionName: (name) =>
        void Sentry.getCurrentScope().setTransactionName(name),
    })
  )
  .notFound(notFound);

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
