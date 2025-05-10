// @vercel/og をimportしないようにするため個別import
import apiApp from "@falling-nikochan/route/dist/src/api/app";
import sitemapApp from "@falling-nikochan/route/dist/src/sitemap";
import shareApp from "@falling-nikochan/route/dist/src/share";
import { briefAppWithHandler } from "@falling-nikochan/route/dist/src/api/brief";
import redirectApp from "@falling-nikochan/route/dist/src/redirect";
import { notFound, onError } from "@falling-nikochan/route/dist/src/error";
import {
  fetchStatic,
  languageDetector,
} from "@falling-nikochan/route/dist/src/env";
import { Hono } from "hono";

const app = new Hono({ strict: false })
  .route("/api", apiApp)
  // .route("/og", ogApp)
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
