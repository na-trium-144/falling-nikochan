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
  getBrief,
  sentryBeforeSend,
} from "./src/index.js";
import { Hono } from "hono";
import { ImageResponse } from "@vercel/og";
import { getConnInfo } from "hono/bun";
import * as Sentry from "@sentry/hono/bun";
import packageJson from "./package.json" with { type: "json" };
import { MongoClient } from "mongodb";
import { createMiddleware } from "hono/factory";
import { compress } from "hono/compress";
import { requestId } from "hono/request-id";
import { structuredLogger } from "@hono/structured-logger";
import pino from "pino";

const port = 8787;

const rootLogger = pino(
  { level: "info" },
  pino.transport({
    // https://axiom.co/docs/guides/pino
    target: "@axiomhq/pino",
    options: {
      dataset: process.env.AXIOM_DATASET,
      token: process.env.AXIOM_TOKEN,
      edge: process.env.AXIOM_EDGE, // us-east-1.aws.edge.axiom.co or eu-central-1.aws.edge.axiom.co
    },
  })
);

const sentryMiddleware = (app) =>
  Sentry.sentry(app, {
    dsn: process.env.SENTRY_DSN,
    release: `${packageJson.version}-bun`,
    sendDefaultPii: false,
    integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
    shouldHandleError: () => false,
    beforeSend: sentryBeforeSend,
  });

const client = new MongoClient(process.env.MONGODB_URI!);
await client.connect();
const db = client.db("nikochan");
console.log(`connected to ${process.env.MONGODB_URI}`);
const dbMiddleware = createMiddleware(async (c, next) => {
  c.set("db", async () => db);
  await next();
});
const fetchBrief = (_e: Bindings, cid: string) => getBrief(db!, cid);

const app = new Hono<{ Bindings: Bindings }>({ strict: false });
app.use(sentryMiddleware(app));
app
  .use(requestId())
  .use(
    structuredLogger({
      createLogger: (c) => rootLogger.child({ requestId: c.var.requestId }),
    })
  )
  .use(compress())
  .route("/api", await apiApp({ getConnInfo, dbMiddleware }))
  .route("/og", ogApp({ ImageResponse, fetchBrief, fetchStatic }))
  .route("/sitemap.xml", await sitemapApp({ dbMiddleware }))
  .route("/rss.xml", await rssApp({ dbMiddleware }))
  .route("/share", shareApp({ fetchBrief, fetchStatic }))
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
      setTransactionName: (name) =>
        void Sentry.getCurrentScope().setTransactionName(name),
    })
  )
  .notFound(notFound);

export default {
  port: port,
  fetch: app.fetch,
  idleTimeout: 255,
};
