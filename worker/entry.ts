import { Context, Hono } from "hono";
import { handle } from "hono/service-worker";
import {
  Bindings,
  fetchError,
  notFound,
  onError,
  redirectApp,
  shareApp,
} from "@falling-nikochan/route";
import { locales } from "@falling-nikochan/i18n/staticMin.js";

const e: Bindings = {
  MONGODB_URI: "",
  IS_SERVICE_WORKER: "1",
};

// なぜconsoleが無い?
declare const self: ServiceWorkerGlobalScope & { console: Console };

const originalConsole = self.console;
self.console = {
  ...originalConsole,
  log: (...args: unknown[]) => {
    originalConsole.log(...args);
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage(args.map((a) => String(a)).join(" "));
      });
    });
  },
  error: (...args: unknown[]) => {
    originalConsole.error(...args);
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage(args.map((a) => String(a)).join(" "));
      });
    });
  },
  warn: (...args: unknown[]) => {
    originalConsole.warn(...args);
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage(args.map((a) => String(a)).join(" "));
      });
    });
  },
  info: (...args: unknown[]) => {
    originalConsole.info(...args);
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage(args.map((a) => String(a)).join(" "));
      });
    });
  },
};

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
  const res = await cache.match(pathname);
  if (res) {
    return res;
  } else {
    // 通常は全部cacheに入っているはずなのでここに来ることはほぼない
    console.warn(`${url} is not in cache`);
    const res = await fetch(
      (process.env.ASSET_PREFIX || self.origin) + url.pathname
    ).catch(fetchError(e));
    if (res.ok) {
      const returnRes = returnBody(res.body, res.headers);
      await (await mainCache()).put(url.pathname, returnRes.clone());
      return returnRes;
    } else {
      return res;
    }
  }
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

// Determine Content-Type from a file path
function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
  const types: Record<string, string> = {
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    mjs: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    wasm: "application/wasm",
    xml: "application/xml",
    gz: "application/gzip",
  };
  return types[ext] ?? "application/octet-stream";
}

// Decompress gzip data using the browser's native DecompressionStream
async function decompressGzip(compressed: ArrayBuffer): Promise<ArrayBuffer> {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  writer.write(new Uint8Array(compressed));
  writer.close();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer as ArrayBuffer;
}

// Parse a tar archive and return file entries (name = relative path, data = content)
function parseTarEntries(
  buffer: ArrayBuffer
): Array<{ name: string; data: ArrayBuffer }> {
  const bytes = new Uint8Array(buffer);
  const entries: Array<{ name: string; data: ArrayBuffer }> = [];
  const decoder = new TextDecoder();
  let offset = 0;
  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset, offset + 512);
    // End-of-archive: two consecutive zero blocks
    if (header.every((b) => b === 0)) break;
    // name (0-99) and prefix (345-499) for paths > 100 chars
    const namePart = decoder
      .decode(header.subarray(0, 100))
      .replace(/\0[\s\S]*$/, "");
    const prefix = decoder
      .decode(header.subarray(345, 500))
      .replace(/\0[\s\S]*$/, "");
    const name = prefix ? prefix + "/" + namePart : namePart;
    // size (124-135): octal string, null/space-terminated
    const sizeStr = decoder
      .decode(header.subarray(124, 136))
      .replace(/[\0\s][\s\S]*$/, "")
      .trim();
    const size = parseInt(sizeStr, 8) || 0;
    // typeflag (156): 0x30='0' or 0x00 = regular file
    const typeflag = header[156];
    offset += 512;
    if ((typeflag === 0x30 || typeflag === 0) && size > 0) {
      entries.push({ name, data: buffer.slice(offset, offset + size) });
    }
    offset += Math.ceil(size / 512) * 512;
  }
  return entries;
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
      (process.env.ASSET_PREFIX || self.origin) + "/buildVer.json",
      { cache: "no-store" }
    ).catch(fetchError(e));
    if (!remoteRes.ok) {
      return sendInitState("failed");
    }
    const remoteVerRes = remoteRes.clone();
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

    // Fetch tar.gz archive (non-_next files) and _next file list simultaneously
    let tarRes: Response;
    let nextFilesRes: Response;
    try {
      [tarRes, nextFilesRes] = await Promise.all([
        fetch(
          (process.env.ASSET_PREFIX || self.origin) +
            "/assets/staticFiles.tar.gz",
          { cache: "no-store" }
        ).catch(fetchError(e)),
        fetch(
          (process.env.ASSET_PREFIX || self.origin) +
            "/assets/staticFiles.json",
          { cache: "no-store" }
        ).catch(fetchError(e)),
      ]);
    } catch (err) {
      console.error(err);
      return sendInitState("failed");
    }
    if (!tarRes.ok || !nextFilesRes.ok) {
      console.error("initAssetsCache: failed to fetch files");
      return sendInitState("failed");
    }

    // _next/ files are still downloaded individually (hash in filename avoids re-download)
    const nextFiles = ((await nextFilesRes.json()) as string[]).map((file) => {
      let pathname = file.replaceAll("[", "%5B").replaceAll("]", "%5D");
      if (pathname.endsWith(".html")) {
        pathname = pathname.slice(0, -5);
      }
      return pathname;
    });

    // Decompress and parse the tar.gz archive
    let tarEntries: Array<{
      pathname: string;
      data: ArrayBuffer;
      contentType: string;
    }>;
    try {
      const tarBuffer = await decompressGzip(await tarRes.arrayBuffer());
      tarEntries = parseTarEntries(tarBuffer).map(({ name, data }) => {
        const originalPath = "/" + name;
        const contentType = getContentType(originalPath);
        let pathname = originalPath
          .replaceAll("[", "%5B")
          .replaceAll("]", "%5D");
        if (pathname.endsWith(".html")) {
          pathname = pathname.slice(0, -5);
        }
        return { pathname, data, contentType };
      });
    } catch (err) {
      console.error("initAssetsCache: failed to decompress tar", err);
      return sendInitState("failed");
    }

    // Determine which _next/ files actually need downloading (uncached ones)
    const nextFilesToFetch = (
      await Promise.all(
        nextFiles.map(async (pathname) =>
          (await cache.match(pathname)) || (await tmp.match(pathname))
            ? null
            : pathname
        )
      )
    ).filter((p): p is string => p !== null);

    let failed = false;
    const totalNum = tarEntries.length + nextFilesToFetch.length;
    let progressNum = 0;
    let progressSize = 0;
    sendInitState("updating", progressNum, totalNum, progressSize);

    // tmpCacheにデータを入れる (tar entries)
    for (const { pathname, data, contentType } of tarEntries) {
      await tmp.put(
        pathname,
        new Response(data, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-store",
          },
        })
      );
      progressNum++;
      progressSize += data.byteLength;
      sendInitState("updating", progressNum, totalNum, progressSize);
    }

    // tmpCacheにデータを入れる (_next/ files, downloaded individually)
    await Promise.all(
      nextFilesToFetch.map(async (pathname: string) => {
        try {
          const res = await fetch(
            (process.env.ASSET_PREFIX || self.origin) + pathname,
            { cache: "no-cache" }
          ).catch(fetchError(e));
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
        } catch (err) {
          console.error(`failed to fetch ${pathname}: ${err}`);
          failed = true;
        }
      })
    );
    // 1つでも失敗したら中断
    if (failed) {
      console.error("initAssetsCache: failed to fetch some files");
      return sendInitState("failed");
    }

    const allPathnames = [
      ...tarEntries.map((entry) => entry.pathname),
      ...nextFiles,
    ];
    if (config.clearOld) {
      const keys = await cache.keys();
      await Promise.all(
        keys.map(async (req) => {
          if (!allPathnames.includes(new URL(req.url).pathname)) {
            console.warn(`delete ${req.url}`);
            await cache.delete(req);
          }
        })
      );
    }
    // tmpからmainに移す
    await Promise.all(
      allPathnames.map(async (pathname: string) => {
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

async function fetchAPI(input: string | URL | Request, init?: RequestInit) {
  const inputReq = input instanceof Request ? input : new Request(input, init);
  const inputUrl = new URL(inputReq.url);
  const res = await fetch(inputReq.clone()).catch(fetchError(e));
  // メインのバックエンドがダウンしていた場合(500番台のエラー or 403(cloudflareが返す) で、通信エラーでないとき)に、代替バックエンドを試す
  // ただし別サーバーでcookieは使えないため、編集関係のAPIは除外
  if (
    (res.status >= 500 || res.status === 403) &&
    process.env.BACKEND_ALT_PREFIX &&
    !inputUrl.pathname.startsWith("/api/chartFile") &&
    !inputUrl.pathname.startsWith("/api/newChartFile") &&
    !inputUrl.pathname.startsWith("/api/hashPasswd")
  ) {
    const altReq = new Request(
      process.env.BACKEND_ALT_PREFIX + inputUrl.pathname + inputUrl.search,
      {
        body: inputReq.body ? await inputReq.blob() : null,
        cache: inputReq.cache,
        credentials: inputReq.credentials,
        headers: inputReq.headers,
        integrity: inputReq.integrity,
        keepalive: inputReq.keepalive,
        method: inputReq.method,
        mode: inputReq.mode,
        // priority: inputReq.priority,
        redirect: inputReq.redirect,
        referrer: inputReq.referrer,
        referrerPolicy: inputReq.referrerPolicy,
        signal: inputReq.signal,
      }
    );
    const resAlt = await fetch(altReq).catch(fetchError(e));
    if (resAlt.ok) {
      return resAlt;
    }
  }
  return res;
}
const app = new Hono({ strict: false })
  .route(
    "/share",
    // fetch済みの新しいページ + 古いサーバーのコード ではバグを起こす可能性があるため、
    // /shareページ自体についてはfetchせずcacheにあるもののみを使用する
    shareApp({
      fetchBrief: (_e, cid: string /*, _ctx */) =>
        fetchAPI(self.origin + `/api/brief/${cid}`),
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
  .all("/api/*", (c) => fetchAPI(c.req.raw))
  .all("/api", (c) => fetchAPI(c.req.raw))
  .get("/sitemap.xml", (c) => fetchAPI(c.req.raw))
  .get("/rss.xml", (c) => fetchAPI(c.req.raw))
  .get("/og/*", async (c) => {
    // return fetch(...) だと、30xリダイレクトを含む場合エラー
    const res = await fetchAPI(c.req.url, {
      credentials: "omit",
    });
    return new Response(res.body, {
      headers: res.headers,
      status: res.status,
    });
  })
  .get("/worker/checkUpdate", async (c) => {
    const result = await initAssetsCache({ clearOld: false });
    switch (result) {
      case "done":
        return c.body(null, 200);
      case "noUpdate":
        return c.body(null, 204);
      case "updating":
      case "inProgress":
        return c.body(null, 202);
      case "failed":
        return c.body(null, 502);
      default:
        result satisfies never;
    }
  })
  .get("/worker/forceUpdate", async (c) => {
    await configCache().then((cache) => cache.delete("/buildVer"));
    const result = await initAssetsCache({ clearOld: false });
    switch (result) {
      case "done":
        return c.body(null, 200);
      case "noUpdate":
        return c.body(null, 204);
      case "updating":
      case "inProgress":
        return c.body(null, 202);
      case "failed":
        return c.body(null, 502);
      default:
        result satisfies never;
    }
  })
  .get("/*", async (c) => {
    if (
      !c.req.path.includes(".") ||
      c.req.path.endsWith(".txt") ||
      c.req.path === "/favicon.ico"
    ) {
      // キャッシュされた古いバージョンのページが読み込まれる問題を避けるために
      // htmlとtxtについてはキャッシュよりも最新バージョンのfetchを優先する
      // 1秒のタイムアウトを設け、fetchできなければキャッシュから返す
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 1000);
      try {
        const remoteRes = await fetch(
          (process.env.ASSET_PREFIX || self.origin) + c.req.path,
          { cache: "no-cache", signal: abortController.signal }
        ).catch(fetchError(e));
        clearTimeout(timeout);
        if (remoteRes.ok) {
          return returnBody(remoteRes.body, remoteRes.headers);
        }
      } catch {
        // pass
      }
    }
    return await fetchStatic(null, new URL(c.req.url));
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
      e.request.url.startsWith(process.env.ASSET_PREFIX))
  ) {
    return handle(app, { fetch: undefined })(e);
  }
});
