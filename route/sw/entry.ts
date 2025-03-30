import { Hono } from "hono";
import { handle } from "hono/service-worker";
import {
  languageDetector,
  notFound,
  onError,
  redirectApp,
  shareApp,
} from "../src/index.js";

declare const self: ServiceWorkerGlobalScope;

const app = new Hono({ strict: false })
  .route("/share", shareApp)
  .route("/", redirectApp)
  .use(languageDetector())
  .onError(onError)
  .notFound(notFound);

self.addEventListener("fetch", handle(app));
