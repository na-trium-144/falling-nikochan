import { Context, Hono } from "hono";
import { handle } from "hono/service-worker";
import {
  notFound,
  onError,
  redirectApp,
  shareApp,
} from "@falling-nikochan/route";
import { locales } from "@falling-nikochan/i18n";

declare const self: ServiceWorkerGlobalScope;

// assetsを保存する
// cacheの中身の仕様を変更したときにはcacheの名前を変える
const mainCache = () => caches.open("main1");
const tmpCache = () => caches.open("tmp1");
// 設定など
const configCache = () => caches.open("config");

async function clearOldCaches() {
  await caches
    .keys()
    .then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== "main1" && k !== "tmp1" && k !== "config")
          .map((k) => caches.delete(k)),
      ),
    );
}

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

// serviceWorkerからクライアントに返すため、cache-controlを削除したresponseを作成
function returnBody(body: string | ReadableStream | null, headers: Headers) {
  return new Response(body, {
    headers: {
      ...(headers.has("Content-Type") && {
        "Content-Type": headers.get("Content-Type")!,
      }),
      "Cache-Control": "no-store",
    },
  });
}

async function initAssetsCache(config: {
  clearOld: boolean;
}): Promise<boolean> {
  // true = success
  const cache = await mainCache();
  const tmp = await tmpCache();
  let filesRes: Response;
  let remoteVerRes: Response;
  try {
    filesRes = await fetch(
      (process.env.ASSET_PREFIX || self.origin) + "/assets/staticFiles.json",
      { cache: "no-store" },
    );
    remoteVerRes = await fetch(
      (process.env.ASSET_PREFIX || self.origin) + "/assets/buildVer.json",
      { cache: "no-store" },
    );
  } catch (e) {
    console.error(e);
    return false;
  }
  if (!filesRes.ok || !remoteVerRes.ok) {
    return false;
  }
  const files = (await filesRes.json()).map((file: string) => {
    let pathname = file.replaceAll("[", "%5B").replaceAll("]", "%5D");
    if (pathname.endsWith(".html")) {
      pathname = pathname.slice(0, -5);
    }
    return pathname;
  });
  // tmpCacheにデータを入れる
  let failed = false;
  await Promise.all(
    files.map(async (pathname: string) => {
      if (
        pathname.startsWith("/_next") &&
        ((await cache.match(pathname)) || (await tmp.match(pathname)))
      ) {
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
            tmp.put(pathname, returnBody(body, res.headers));
          } else {
            tmp.put(pathname, returnBody(res.body, res.headers));
          }
        } else {
          console.error(`failed to fetch ${pathname}: ${res.status}`);
          failed = true;
        }
      } catch (e) {
        console.error(`failed to fetch ${pathname}: ${e}`);
        failed = true;
      }
    }),
  );
  // 1つでも失敗したら中断
  if (failed) {
    return false;
  }
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
  // tmpからmainに移す
  await Promise.all(
    files.map(async (pathname: string) => {
      const res = await tmp.match(pathname);
      if (res) {
        await cache.put(pathname, res);
        await tmp.delete(pathname);
      }
    }),
  );
  // finished
  await configCache().then((cache) => cache.put("/buildVer", remoteVerRes));
  return true;
}

interface BuildVer {
  date: string;
  commit: string;
  version: string;
}

const languageDetector = async (c: Context, next: () => Promise<void>) => {
  // headerもcookieも使えないので、その代わりにnavigator.languagesを使って検出するミドルウェア
  const systemLangs = navigator.languages.map(
    (l) => new Intl.Locale(l).language,
  );
  const preferredLang = c.req.path.split("/")[1];
  const cache = await configCache();
  const preferredLang2 = await cache.match("/lang").then((res) => res?.text());
  let lang: string;
  if (preferredLang && locales.includes(preferredLang)) {
    lang = preferredLang;
  } else if (preferredLang2 && locales.includes(preferredLang2)) {
    lang = preferredLang2;
  } else {
    lang = systemLangs.find((l) => locales.includes(l)) || "en";
  }
  c.set("language", lang);
  cache.put("/lang", new Response(lang));
  await next();
};

const app = new Hono({ strict: false })
  .route(
    "/share",
    shareApp({
      fetchBrief: (cid) => fetch(`/api/brief/${cid}`),
      fetchStatic,
      languageDetector,
    }),
  )
  .route(
    "/",
    redirectApp({
      languageDetector,
    }),
  )
  .all("/api/*", (c) => fetch(c.req.raw))
  .get("/og/*", (c) => fetch(c.req.raw))
  .get("/worker/checkUpdate", async (c) => {
    let remoteVer: BuildVer;
    const remoteRes = await fetch(
      (process.env.ASSET_PREFIX || self.origin) + "/assets/buildVer.json",
      { cache: "no-store" },
    );
    if (!remoteRes.ok) {
      return c.body(null, 500);
    }
    remoteVer = await remoteRes.json();
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
    if (await initAssetsCache({ clearOld: !!c.req.query("clearOld") })) {
      return c.body(null);
    } else {
      return c.body(null, 503);
    }
  })
  .get("/*", async (c) => {
    const res = await fetchStatic(null, new URL(c.req.url));
    if (res.ok) {
      return res;
    } else {
      // failsafe 通常は全部cacheに入っているはずだが
      console.warn(`${c.req.url} is not in cache`);
      const res = await fetch(c.req.raw);
      if (res.ok) {
        const returnRes = returnBody(res.body, res.headers);
        await (await mainCache()).put(c.req.raw, returnRes.clone());
        return returnRes;
      } else {
        return res;
      }
    }
  })
  .use(languageDetector)
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

self.addEventListener("install", (e) => {
  console.log("service worker install");
  self.skipWaiting();
  e.waitUntil(initAssetsCache({ clearOld: true }));
});
self.addEventListener("activate", (e) => {
  console.log("service worker activate");
  e.waitUntil(Promise.all([self.clients.claim(), clearOldCaches()]));
});

self.addEventListener("fetch", (e) => {
  if (new URL(e.request.url).origin !== self.origin) {
    return;
  }
  // @ts-expect-error Type 'void' is not assignable to type 'undefined'.
  return handle(app)(e);
});
