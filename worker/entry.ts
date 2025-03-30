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
async function fetchStatic(_e: any, url: URL): Promise<Response> {
  const cache = await caches.open(cacheName);
  let pathname = url.pathname;
  if (pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  if (!pathname.split("/").pop()?.includes(".")) {
    pathname += ".html";
  }
  pathname = pathname.replaceAll("[", "%5B").replaceAll("]", "%5D");
  return (await cache.match(pathname)) || new Response(null, { status: 404 });
}

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
    if (
      !c.req.url.startsWith(self.origin) &&
      !c.req.url.startsWith(process.env.ASSET_PREFIX || "null")
    ) {
      return fetch(c.req.raw);
    }
    const res = await fetchStatic(null, new URL(c.req.url));
    if (res.ok) {
      return res;
    } else {
      return c.notFound();
    }
  })
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

async function initAssetsCache() {
  const cache = await caches.open(cacheName);
  const filesRes = await fetch(
    (process.env.ASSET_PREFIX || self.origin) + "/assets/staticFiles.json",
  );
  if (filesRes.ok) {
    await Promise.all([
      (await filesRes.json()).map(async (file: string) => {
        const pathname = file.replaceAll("[", "%5B").replaceAll("]", "%5D");
        cache.put(
          pathname,
          await fetch((process.env.ASSET_PREFIX || self.origin) + pathname),
        );
      }),
    ]);
  }
}
self.addEventListener("install", (e) => {
  console.log("service worker install");
  self.skipWaiting();
  e.waitUntil(initAssetsCache());
});
self.addEventListener("activate", (e) => {
  console.log("service worker activate");
  e.waitUntil(Promise.all([self.clients.claim(), initAssetsCache()]));
});

// @ts-expect-error Type 'void' is not assignable to type 'undefined'.
self.addEventListener("fetch", handle(app));
