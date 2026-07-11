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
  cronTestApp,
  getBrief,
} from "./src/index.js";
import { Hono } from "hono";
import { ImageResponse } from "@vercel/og";
import { getConnInfo } from "@hono/node-server/conninfo";
import { Db, MongoClient } from "mongodb";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { structuredLogger } from "@hono/structured-logger";

const port = 8787;

let db: Db | null = null;
let isProd = false;
if (process.env.MONGODB_URI) {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db("nikochan");
  console.log(`connected to ${process.env.MONGODB_URI}`);
  if (/[a-z]\.[a-z]/.test(process.env.MONGODB_URI)) {
    console.warn("This seems to be a production server!");
    isProd = true;
  }
} else {
  console.warn("MONGODB_URI not set");
}
const dbMiddleware = createMiddleware(async (c, next) => {
  c.set("db", async () => {
    if (!["GET", "HEAD"].includes(c.req.method) && isProd) {
      throw new HTTPException(405, { message: "readonlyOnDev" });
    }
    return db;
  });
  await next();
});
const fetchBrief = (_e: Bindings, cid: string) => getBrief(db!, cid);

console.log(`Server is running on http://localhost:${port}`);

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .use(
    structuredLogger({
      createLogger: () => console,
      onRequest: () => undefined,
    })
  )
  .route("/api", await apiApp({ getConnInfo, dbMiddleware }))
  .route("/og", ogApp({ ImageResponse, fetchBrief, fetchStatic }))
  .route("/cron", cronTestApp)
  .route("/sitemap.xml", await sitemapApp({ dbMiddleware }))
  .route("/rss.xml", await rssApp({ dbMiddleware }))
  .route("/share", shareApp({ fetchBrief, fetchStatic }))
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
    onError({ fetchStatic, captureException: null, setTransactionName: null })
  )
  .notFound(notFound);

serve({
  fetch: app.fetch,
  port,
});
