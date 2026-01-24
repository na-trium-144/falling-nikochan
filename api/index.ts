// ファイル名が api/index.ts でないとvercelは認識してくれない
// すべてのimportの拡張子に .js がついていないとvercelは認識してくれない
// Set NODEJS_HELPERS=0 in Vercel production environment variables. https://github.com/honojs/hono/issues/1256

import { handle } from "hono/vercel";
import {
  apiApp,
  ogApp,
  sitemapApp,
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

// export const config = {
//   runtime: "nodejs",
// };

const app = new Hono({ strict: false })
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
  .route(
    "/share",
    shareApp({
      fetchBrief: fetchBrief({ fetchStatic }),
      fetchStatic,
    })
  )
  .route("/", redirectApp({ fetchStatic }))
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
