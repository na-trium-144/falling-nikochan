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

// assetsを保存する
const mainCache = () => caches.open("main");
// 設定など
const configCache = () => caches.open("config");

async function fetchStatic(_e: any, url: URL): Promise<Response> {
  const cache = await mainCache();
  let pathname = url.pathname;
  if (pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  if (pathname.endsWith(".html")) {
    pathname = pathname.slice(0, -5);
  }
  pathname = pathname.replaceAll("[", "%5B").replaceAll("]", "%5D");
  return (await cache.match(pathname)) || new Response(null, { status: 404 });
}

async function initAssetsCache(config: { clearOld: boolean }) {
  const cache = await mainCache();
  const filesRes = await fetch(
    (process.env.ASSET_PREFIX || self.origin) + "/assets/staticFiles.json",
  );
  if (filesRes.ok) {
    const files = (await filesRes.json()).map((file: string) => {
      let pathname = file.replaceAll("[", "%5B").replaceAll("]", "%5D");
      if (pathname.endsWith(".html")) {
        pathname = pathname.slice(0, -5);
      }
      return pathname;
    });
    const pFetch = files.map(async (pathname: string) => {
      if (pathname.startsWith("/_next") && (await cache.match(pathname))) {
        // パス名にハッシュが入っているので更新する必要がない
        return;
      }
      try {
        const res = await fetch(
          (process.env.ASSET_PREFIX || self.origin) + pathname,
          { cache: "no-cache" },
        );
        if (res.ok) {
          if (
            process.env.ASSET_PREFIX &&
            (res.headers.get("Content-Type")?.includes("html") ||
              pathname.endsWith(".js") ||
              pathname.endsWith(".css") ||
              pathname.endsWith(".txt"))
          ) {
            // ページ内で ASSET_PREFIX にアクセスしている箇所をすべてもとのドメインに置き換えてserviceWorkerを経由されるようにする
            const body = (await res.text()).replaceAll(
              process.env.ASSET_PREFIX,
              "",
            );
            cache.put(
              pathname,
              new Response(body, {
                headers: res.headers,
              }),
            );
          } else {
            cache.put(pathname, res);
          }
        } else {
          console.error(`failed to fetch ${pathname}: ${res.status}`);
        }
      } catch (e) {
        console.error(`failed to fetch ${pathname}: ${e}`);
      }
    });
    if (config.clearOld) {
      const keys = await cache.keys();
      await Promise.all(
        keys.map(async (req) => {
          if (!files.includes(new URL(req.url).pathname)) {
            console.warn(`delete ${req.url}`);
            await cache.delete(req);
          }
        }),
      );
    }
    await Promise.all(pFetch);
    const remoteVer = await fetch(
      (process.env.ASSET_PREFIX || self.origin) + "/assets/buildVer.json",
    );
    if (remoteVer.ok) {
      await configCache().then((cache) => cache.put("/buildVer", remoteVer));
    }
  }
}

interface BuildVer {
  date: string;
  commit: string;
  version: string;
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
  .get("/worker/checkUpdate", async (c) => {
    const remoteVer: BuildVer = await fetch(
      (process.env.ASSET_PREFIX || self.origin) + "/assets/buildVer.json",
    ).then((res) => res.json());
    const cacheVer: BuildVer | undefined = await configCache().then((cache) =>
      cache.match("/buildVer").then((res) => res?.json()),
    );
    if (remoteVer.version !== cacheVer?.version) {
      return c.json({ version: true, commit: true });
    } else if (
      remoteVer.commit !== cacheVer?.commit ||
      remoteVer.date !== cacheVer?.date
    ) {
      return c.json({ version: false, commit: true });
    } else {
      return c.json({ version: false, commit: false });
    }
  })
  .get("/worker/initAssets", async (c) => {
    await initAssetsCache({ clearOld: !!c.req.query("clearOld") });
    return c.body(null);
  })
  .get("/*", async (c) => {
    const res = await fetchStatic(null, new URL(c.req.url));
    if (res.ok) {
      return res;
    } else {
      return fetch(c.req.raw);
    }
  })
  .use(languageDetector())
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

self.addEventListener("install", (e) => {
  console.log("service worker install");
  self.skipWaiting();
  e.waitUntil(initAssetsCache({ clearOld: true }));
});
self.addEventListener("activate", (e) => {
  console.log("service worker activate");
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  if (new URL(e.request.url).origin !== self.origin) {
    return;
  }
  // @ts-expect-error Type 'void' is not assignable to type 'undefined'.
  return handle(app)(e);
});
