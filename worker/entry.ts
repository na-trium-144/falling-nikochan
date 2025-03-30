import { Hono } from "hono";
import { handle } from "hono/service-worker";
import {
  languageDetector,
  notFound,
  onError,
  redirectApp,
  shareApp,
} from "@falling-nikochan/route";

declare const self: ServiceWorkerGlobalScope;
const cacheName = "nikochan-sw";
const fetchStatic = async (_e: any, url: URL) => {
  const res = await caches.open(cacheName).then((c) => c.match(url));
  if (res) {
    return res;
  } else {
    return new Response(null, { status: 404 });
  }
};

const app = new Hono({ strict: false })
  .route(
    "/share",
    shareApp({
      fetchBrief: (cid) => fetch(`/api/brief/${cid}`),
      fetchStatic,
    }),
  )
  .route("/", redirectApp)
  .all("/api/*", (c) => fetch(c.req.raw))
  .get("/og/*", (c) => fetch(c.req.raw))
  .get("/*", async (c) => {
    const res = await caches.open(cacheName).then((ch) => ch.match(c.req.raw));
    if (res) {
      return res;
    } else {
      return c.notFound();
    }
  })
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

async function initAssetsCache() {
  const cache = caches.open(cacheName);
  const filesRes = await fetch(self.origin + "/assets/staticFiles.json");
  if (filesRes.ok) {
    await (await cache).addAll(await filesRes.json());
  }
}
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(initAssetsCache());
});
self.addEventListener("activate", (e) => {
  e.waitUntil(Promise.all([self.clients.claim(), initAssetsCache()]));
});

// @ts-expect-error Type 'void' is not assignable to type 'undefined'.
self.addEventListener("fetch", handle(app));
