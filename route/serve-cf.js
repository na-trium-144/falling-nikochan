import {
  apiApp,
  ogApp,
  redirectApp,
  sitemapApp,
  shareApp,
  languageDetector,
  onError,
  notFound,
  fetchBrief,
} from "@falling-nikochan/route";
import { Hono } from "hono";
import { ImageResponse } from "@cloudflare/pages-plugin-vercel-og/api";

const fetchStatic = (e, url) => e.ASSETS.fetch(url);

const app = new Hono({ strict: false })
  .route("/api", apiApp)
  .route(
    "/og",
    ogApp({
      ImageResponse,
      fetchBrief: fetchBrief({ fetchStatic }),
      fetchStatic,
    }),
  )
  .route("/sitemap.xml", sitemapApp)
  .route(
    "/share",
    shareApp({
      fetchBrief: fetchBrief({ fetchStatic }),
      fetchStatic,
    }),
  )
  .route("/", redirectApp({ fetchStatic }))
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

export default app;
