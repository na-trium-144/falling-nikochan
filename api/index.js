// ファイル名が api/index.ts でないとvercelは認識してくれない
// すべてのimportの拡張子に .js がついていないとvercelは認識してくれない
// Set NODEJS_HELPERS=0 in Vercel production environment variables. https://github.com/honojs/hono/issues/1256

import { handle } from "hono/vercel";
import {
  apiApp,
  ogApp,
  shareApp,
  redirectApp,
  languageDetector,
  onError,
  notFound,
  fetchStatic,
} from "@falling-nikochan/route";
import { briefApp } from "@falling-nikochan/route/src/api/brief.js";
import { Hono } from "hono";

// export const config = {
//   runtime: "nodejs",
// };

const app = new Hono({ strict: false })
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
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
