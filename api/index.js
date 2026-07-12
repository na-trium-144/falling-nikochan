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
  getBrief,
  sentryBeforeSend,
  discordInviteApp,
} from "@falling-nikochan/route";
import { Hono } from "hono";
import { ImageResponse } from "@vercel/og";
import { getConnInfo } from "hono/vercel";
import { compress } from "hono/compress";
import * as Sentry from "@sentry/hono/node";
import packageJson from "@falling-nikochan/route/package.json" with { type: "json" };
import { MongoClient } from "mongodb";
import { createMiddleware } from "hono/factory";
import { attachDatabasePool } from "@vercel/functions";
import { structuredLogger } from "@hono/structured-logger";

// export const config = {
//   runtime: "nodejs",
// };

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: `${packageJson.version}-v-${process.env.VERCEL_URL.replace(".vercel.app", "")}`,
  environment: process.env.VERCEL_TARGET_ENV,
  sendDefaultPii: false,
  normalizeDepth: 11,
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
  includeLocalVariables: true,
  beforeSend: sentryBeforeSend,
});
const sentryMiddleware = (app) =>
  Sentry.sentry(app, { shouldHandleError: () => false });

const client = new MongoClient(process.env.MONGODB_URI);
attachDatabasePool(client);
await client.connect();
const db = client.db("nikochan");
console.log(`connected to ${process.env.MONGODB_URI}`);
const dbMiddleware = createMiddleware(async (c, next) => {
  c.set("db", async () => db);
  await next();
});
const fetchBrief = (_e, cid) => getBrief(db, cid);

const app = new Hono({ strict: false });
app.use(sentryMiddleware(app));
app
  .use(structuredLogger({ createLogger: () => console }))
  .use(compress())
  .route("/api", await apiApp({ getConnInfo, dbMiddleware }))
  .route("/og", ogApp({ ImageResponse, fetchBrief, fetchStatic }))
  .route("/sitemap.xml", await sitemapApp({ dbMiddleware }))
  .route("/rss.xml", await rssApp({ dbMiddleware }))
  .route("/share", shareApp({ fetchBrief, fetchStatic }))
  .route("/discord", discordInviteApp)
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
