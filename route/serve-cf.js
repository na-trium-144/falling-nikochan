// @vercel/og をimportしないようにするため個別import
import {
  apiApp,
  ogApp,
  redirectApp,
  sitemapApp,
  shareApp,
  languageDetector,
  onError,
  notFound,
  fetchStatic,
  briefAppWithHandler,
} from "@falling-nikochan/route";
import { Hono } from "hono";
import { ImageResponse } from "@cloudflare/pages-plugin-vercel-og/api";

const app = new Hono({ strict: false })
  .route("/api", apiApp)
  .route("/og", ogApp({ ImageResponse }))
  .route("/sitemap.xml", sitemapApp)
  .route(
    "/share",
    shareApp({
      fetchBrief: (cid) =>
        briefAppWithHandler({ fetchStatic }).request(`/api/${cid}`),
      fetchStatic,
    }),
  )
  .route("/", redirectApp({ fetchStatic }))
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

export default app;
