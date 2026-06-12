import { ChartBrief, ChartBriefSchema } from "@falling-nikochan/chart";
import { captureAndWrap, fetchBackend } from "./fetch";
import * as v from "valibot";

function briefKeyOld(cid: string) {
  return "brief-" + cid;
}
const briefCacheName = "brief1";

// w/や引用符を除いた部分
export const etagContentRegex = /\d+-[a-zA-Z0-9+/]+=*/;

interface Callbacks {
  onResult: (brief: ChartBrief & { etag: string }) => void;
  onNotFound?: () => void;
  onError?: (e: Error) => void;
}
/**
 * cacheからbriefデータを取得し、あればonResultを呼ぶ。
 * APIをfetchし、レスポンスが返ってきたら再度onResultを呼ぶ。
 * APIのレスポンスが404だった場合は、onNotFoundを呼びcacheを消す。
 * APIのレスポンスがエラーになり、かつcacheデータもない場合、onErrorを呼ぶ。fetchBrief()側でsentryへは送信済み。
 */
export async function fetchBrief(cid: string, callbacks: Callbacks) {
  let cache: Cache | undefined = undefined;
  if ("caches" in window) {
    window.caches
      .keys()
      .then((keys) =>
        keys
          .filter((k) => k.startsWith("brief") && k !== briefCacheName)
          .forEach((k) => window.caches.delete(k))
      );
    cache = await window.caches.open(briefCacheName);
  }
  let hasResult = false;
  let cachePromise: Promise<void> | undefined = undefined;

  const staleLS = localStorage.getItem(briefKeyOld(cid));
  if (staleLS) {
    cache?.put(`/api/brief/${cid}`, new Response(staleLS));
    localStorage.removeItem(briefKeyOld(cid));
    callbacks.onResult({ ...(JSON.parse(staleLS) as ChartBrief), etag: "" });
    hasResult = true;
  } else {
    cachePromise = cache?.match(`/api/brief/${cid}`).then(async (res) => {
      if (res) {
        callbacks.onResult({
          ...((await res.json()) as ChartBrief),
          etag: res.headers.get("ETag")?.match(etagContentRegex)?.[0] ?? "",
        });
        hasResult = true;
      }
    });
  }

  fetchBackend()
    .url(`/api/brief/${cid}`)
    .query(
      briefIsStale(cid)
        ? // クエリパラメータをセットすることでキャッシュを回避し最新のbriefを取得する。パラメータ自体に意味はない。
          { refreshKey: localStorage.getItem(briefStaleKey(cid)) }
        : {}
    )
    .get()
    .notFound(async () => {
      await cachePromise;
      if ("caches" in window) {
        cache?.delete(`/api/brief/${cid}`);
      }
      localStorage.removeItem(briefKeyOld(cid));
      callbacks.onNotFound?.();
      hasResult = false;
    })
    .res(async (res) => {
      const result = v.parse(ChartBriefSchema(), await res.clone().json());
      await cachePromise;
      callbacks.onResult({
        ...result,
        etag: res.headers.get("ETag")?.match(/\d+-[a-zA-Z0-9+/]+=*/)?.[0] ?? "",
      });
      hasResult = true;
      await cache?.put(`/api/brief/${cid}`, res);
    })
    .catch(async (e: unknown) => {
      await cachePromise;
      e = captureAndWrap(e, { cid });
      if (!hasResult) {
        callbacks.onError?.(e as Error);
      }
    });
}

export function briefStaleKey(cid: string) {
  return `stale-${cid}`;
}
/**
 * 412レスポンスを受け取った場合に、localStorageに時刻を保存
 * その間fetchBrief()はリクエストにクエリパラメータをセットすることでキャッシュを回避し最新のbriefを取得する。
 */
export function refreshBrief(cid: string) {
  localStorage.setItem(briefStaleKey(cid), String(Date.now()));
}
export function briefIsStale(cid: string) {
  if (
    localStorage.getItem(briefStaleKey(cid)) &&
    Date.now() - Number(localStorage.getItem(briefStaleKey(cid))) < 600 * 1000
  ) {
    return true;
  } else {
    localStorage.removeItem(briefStaleKey(cid));
    return false;
  }
}
