import { ChartBrief, ChartBriefSchema } from "@falling-nikochan/chart";
import { captureAndWrap, fetchBackend } from "./fetch";
import * as v from "valibot";

function briefKeyOld(cid: string) {
  return "brief-" + cid;
}
const briefCacheName = "brief1";

interface Callbacks {
  onResult: (brief: ChartBrief) => void;
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
  window.caches
    .keys()
    .then((keys) =>
      keys
        .filter((k) => k.startsWith("brief") && k !== briefCacheName)
        .forEach((k) => window.caches.delete(k))
    );
  let cache: Cache | undefined = undefined;
  if ("caches" in window) {
    cache = await window.caches.open(briefCacheName);
  }
  let hasResult = false;

  const staleLS = localStorage.getItem(briefKeyOld(cid));
  if (staleLS) {
    cache?.put(`/api/brief/${cid}`, new Response(staleLS));
    localStorage.removeItem(briefKeyOld(cid));
    callbacks.onResult(JSON.parse(staleLS) as ChartBrief);
    hasResult = true;
  } else {
    cache?.match(`/api/brief/${cid}`).then(async (res) => {
      if (res) {
        callbacks.onResult((await res.json()) as ChartBrief);
        hasResult = true;
      }
    });
  }

  fetchBackend()
    .get(`/api/brief/${cid}`)
    .notFound(async () => {
      if ("caches" in window) {
        cache?.delete(`/api/brief/${cid}`);
      }
      localStorage.removeItem(briefKeyOld(cid));
      callbacks.onNotFound?.();
      hasResult = false;
    })
    .res(async (res) => {
      callbacks.onResult(v.parse(ChartBriefSchema(), await res.clone().json()));
      hasResult = true;
      await cache?.put(`/api/brief/${cid}`, res);
    })
    .catch((e: unknown) => {
      e = captureAndWrap(e, { cid });
      if (!hasResult) {
        callbacks.onError?.(e as Error);
      }
    });
}
