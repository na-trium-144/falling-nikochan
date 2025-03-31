import { serveStatic } from "hono/bun";
import {
  apiApp,
  ogApp,
  redirectApp,
  shareApp,
  Bindings,
  languageDetector,
  onError,
  notFound,
  fetchStatic,
} from "./src/index.js";
import { Hono } from "hono";
import { logger } from 'hono/logger'
import briefApp from "./src/api/brief.js";

const port = 8787;

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .use(logger())
  .route("/api", apiApp)
  .route("/og", ogApp)
  .route(
    "/share",
    shareApp({
      fetchBrief: (cid) => briefApp.request(`/${cid}`),
      fetchStatic,
    }),
  )
  .route("/", redirectApp())
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
    }),
  )
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

export default {
  port: port,
  fetch: app.fetch,
};
