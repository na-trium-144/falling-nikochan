import { Context, Hono } from "hono";
import { handle } from "hono/service-worker";
import {
  notFound,
  onError,
  redirectApp,
  shareApp,
} from "@falling-nikochan/route";
import { locales } from "@falling-nikochan/i18n/staticMin.js";

declare const self: ServiceWorkerGlobalScope;

// assetsを保存する
// cacheの中身の仕様を変更したときにはcacheの名前を変える
const mainCacheName = "main2";
const tmpCacheName = "tmp2";
const mainCache = () => caches.open(mainCacheName);
const tmpCache = () => caches.open(tmpCacheName);
// 設定など
const configCacheName = "config";
const configCache = () => caches.open(configCacheName);

async function clearOldCaches() {
  await caches.keys().then((keys) =>
    Promise.all(
      keys
        .filter(
          (k) =>
            ![mainCacheName, tmpCacheName, configCacheName].includes(k) &&
            !k.startsWith("brief") // used in @/common/briefCache
        )
        .map((k) => caches.delete(k))
    )
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

interface InitAssetsState {
  type: "initAssets";
  state: InitAssetsResult;
  progressNum?: number;
  totalNum?: number;
  progressSize?: number;
}
function sendInitState(
  state: InitAssetsResult,
  progressNum?: number,
  totalNum?: number,
  progressSize?: number
) {
  // クライアントに初期化状態を送信する
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "initAssets",
        state,
        progressNum,
        totalNum,
        progressSize,
      } satisfies InitAssetsState);
    });
  });
  return state;
}

let initInProgress = false;

type InitAssetsResult =
  | "done"
  | "failed"
  | "updating"
  | "noUpdate"
  | "inProgress";
async function initAssetsCache(config: {
  clearOld: boolean;
}): Promise<InitAssetsResult> {
  if (initInProgress) {
    console.warn("initAssetsCache: already in progress");
    return sendInitState("inProgress");
  }
  initInProgress = true;
  try {
    let remoteVer: BuildVer;
    const remoteRes = await fetch(
      (process.env.ASSET_PREFIX || self.origin) + "/assets/buildVer.json",
      { cache: "no-store" }
    );
    if (!remoteRes.ok) {
      return sendInitState("failed");
    }
    remoteVer = await remoteRes.json();
    const cacheVer: BuildVer | undefined = await configCache().then((cache) =>
      cache.match("/buildVer").then((res) => res?.json())
    );
    if (
      remoteVer.version === cacheVer?.version &&
      remoteVer.commit === cacheVer?.commit &&
      remoteVer.date === cacheVer?.date
    ) {
      return sendInitState("noUpdate");
    }

    sendInitState("updating");

    const cache = await mainCache();
    const tmp = await tmpCache();
    let filesRes: Response;
    let remoteVerRes: Response;
    try {
      filesRes = await fetch(
        (process.env.ASSET_PREFIX || self.origin) + "/assets/staticFiles.json",
        { cache: "no-store" }
      );
      remoteVerRes = await fetch(
        (process.env.ASSET_PREFIX || self.origin) + "/assets/buildVer.json",
        { cache: "no-store" }
      );
    } catch (e) {
      console.error(e);
      return sendInitState("failed");
    }
    if (!filesRes.ok || !remoteVerRes.ok) {
      console.error("initAssetsCache: failed to fetch json");
      return sendInitState("failed");
    }
    const files = ((await filesRes.json()) as string[])
      .map((file) => {
        let pathname = file.replaceAll("[", "%5B").replaceAll("]", "%5D");
        if (pathname.endsWith(".html")) {
          pathname = pathname.slice(0, -5);
        }
        return pathname;
      })
      .filter((n) => !n.endsWith(".ttf"))
      .filter((n) => !n.includes("icon"))
      .filter((n) => !n.includes("ogTemplate"));
    // tmpCacheにデータを入れる
    let failed = false;
    let totalNum = files.length;
    let progressNum = 0;
    let progressSize = 0;
    await Promise.all(
      files.map(async (pathname: string) => {
        if (
          pathname.startsWith("/_next") &&
          ((await cache.match(pathname)) || (await tmp.match(pathname)))
        ) {
          // パス名にハッシュが入っているので更新する必要がない
          totalNum--;
          sendInitState("updating", progressNum, totalNum, progressSize);
          return;
        }
        try {
          const res = await fetch(
            (process.env.ASSET_PREFIX || self.origin) + pathname,
            { cache: "no-cache" }
          );
          if (res.ok) {
            tmp.put(pathname, returnBody(res.clone().body, res.headers));
            progressNum++;
            const size = (await res.arrayBuffer()).byteLength;
            progressSize += size;
            sendInitState("updating", progressNum, totalNum, progressSize);
          } else {
            console.error(`failed to fetch ${pathname}: ${res.status}`);
            failed = true;
          }
        } catch (e) {
          console.error(`failed to fetch ${pathname}: ${e}`);
          failed = true;
        }
      })
    );
    // 1つでも失敗したら中断
    if (failed) {
      console.error("initAssetsCache: failed to fetch some files");
      return sendInitState("failed");
    }
    if (config.clearOld) {
      const keys = await cache.keys();
      await Promise.all(
        keys.map(async (req) => {
          if (!files.includes(new URL(req.url).pathname)) {
            console.warn(`delete ${req.url}`);
            await cache.delete(req);
          }
        })
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
      })
    );
    // finished
    await configCache().then((cache) => cache.put("/buildVer", remoteVerRes));
    console.log("initAssetsCache: finished");
    return sendInitState("done");
  } finally {
    initInProgress = false;
  }
}

interface BuildVer {
  date: string;
  commit: string;
  version: string;
}

const languageDetector = async (c: Context, next: () => Promise<void>) => {
  // headerもcookieも使えないので、その代わりにnavigator.languagesを使って検出するミドルウェア
  const systemLangs = navigator.languages.map(
    (l) => new Intl.Locale(l).language
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
    // fetch済みの新しいページ + 古いサーバーのコード ではバグを起こす可能性があるため、
    // /shareページ自体についてはfetchせずcacheにあるもののみを使用する
    shareApp({
      fetchBrief: (_e, cid: string) => fetch(self.origin + `/api/brief/${cid}`),
      fetchStatic,
      languageDetector,
    })
  )
  .route(
    "/",
    redirectApp({
      languageDetector,
      fetchStatic,
    })
  )
  // return fetch(...) だと、30xリダイレクトを含む場合エラー
  .all("/api/*", (c) => fetch(c.req.raw))
  .all("/api", (c) => fetch(c.req.raw))
  .get("/og/*", async (c) => {
    const res = await fetch(c.req.url, {
      credentials: "omit",
    });
    return new Response(res.body, {
      headers: res.headers,
      status: res.status,
    });
  })
  .get("/worker/checkUpdate", async (c) => {
    switch (await initAssetsCache({ clearOld: false })) {
      case "done":
        return c.body(null, 200);
      case "noUpdate":
        return c.body(null, 204);
      case "updating":
      case "inProgress":
        return c.body(null, 202);
      case "failed":
        return c.body(null, 502);
    }
  })
  .get("/*", async (c) => {
    if (!c.req.path.includes(".") || c.req.path.endsWith(".txt")) {
      // キャッシュされた古いバージョンのページが読み込まれる問題を避けるために
      // htmlとtxtについてはキャッシュよりも最新バージョンのfetchを優先する
      // 1秒のタイムアウトを設け、fetchできなければキャッシュから返す
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 1000);
      try {
        const remoteRes = await fetch(
          (process.env.ASSET_PREFIX || self.origin) + c.req.path,
          { cache: "no-cache", signal: abortController.signal }
        );
        clearTimeout(timeout);
        if (remoteRes.ok) {
          return returnBody(remoteRes.body, remoteRes.headers);
        }
      } catch {
        // pass
      }
    }
    const res = await fetchStatic(null, new URL(c.req.url));
    if (res.ok) {
      return res;
    } else {
      // 通常は全部cacheに入っているはずなのでここに来ることはほぼない
      console.warn(`${c.req.url} is not in cache`);
      const res = await fetch(
        (process.env.ASSET_PREFIX || self.origin) + c.req.path
      );
      if (res.ok) {
        const returnRes = returnBody(res.body, res.headers);
        await (await mainCache()).put(c.req.path, returnRes.clone());
        return returnRes;
      } else {
        return res;
      }
    }
  })
  .use(languageDetector)
  .onError(onError({ fetchStatic }))
  .notFound(notFound);

self.addEventListener("install", () => {
  console.log("service worker install");
  self.skipWaiting();
  // e.waitUntil(initAssetsCache({ clearOld: true }));
});
self.addEventListener("activate", (e) => {
  console.log("service worker activate");
  e.waitUntil(Promise.all([self.clients.claim(), clearOldCaches()]));
});

self.addEventListener("fetch", (e) => {
  if (
    new URL(e.request.url).origin === self.origin ||
    (process.env.ASSET_PREFIX &&
      new URL(e.request.url).origin === process.env.ASSET_PREFIX)
  ) {
    return handle(app)(e);
  }
});
