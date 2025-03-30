import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  apiApp,
  ogApp,
  redirectApp,
  shareApp,
  Bindings,
  languageDetector,
  onError,
  notFound,
} from "./src/index.js";
import { Hono } from "hono";

const port = 8787;
console.log(`Server is running on http://localhost:${port}`);

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .route("/api", apiApp)
  .route("/og", ogApp)
  .route("/share", shareApp)
  .route("/", redirectApp)
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
  .onError(onError)
  .notFound(notFound);

serve({
  fetch: app.fetch,
  port,
});
