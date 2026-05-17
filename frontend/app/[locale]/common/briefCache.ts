"use client";

import { useState, useEffect } from "react";
import { ChartBrief } from "@falling-nikochan/chart";
import { APIError } from "./apiError";
import * as Sentry from "@sentry/nextjs";

async function migrateFromOldCache(cid: string): Promise<ChartBrief | null> {
  const staleLS = localStorage.getItem("brief-" + cid);
  localStorage.removeItem("brief-" + cid);

  let staleRes: string | undefined = undefined;
  if ("caches" in window) {
    const cache = await window.caches.open("brief1");
    const res = await cache.match(`/api/brief/${cid}`);
    if (res) {
      staleRes = await res.text();
      await cache.delete(`/api/brief/${cid}`);
    }
  }

  return JSON.parse(staleRes ?? staleLS ?? "null");
}

// 重複リクエスト防止用のグローバル状態
const pendingFetches = new Map<string, Promise<ChartBrief | APIError>>();

/**
 * fetchとcacheStorageでstale-while-revalidateのような挙動を実現するフック。
 * idの配列に対して(Data | undefined(=loading) | エラー情報)の配列を返す。
 * このフックが複数同時実行されたとしても、同じidに対して複数のGETリクエストが同時に送られることはない。
 * 各idについて、
 * - cacheに保存されているデータが新しければそれを返しfetchしない
 * - cacheに保存されているデータが古ければそれを返すが、それと同時にfetchし、cacheに保存すると同時に返り値も更新して再レンダリングする。
 * - cacheに保存されていなければfetchを行いその間loading表示
 * - fetchの結果が404だった場合は、返り値からその要素を除外する。cacheからも削除する。
 * - fetchの結果が5xxだった場合は、cacheに保存されているデータがあれば引き続きそれを表示しcacheは保持。cacheにもない場合はエラーメッセージを返すが要素自体は除外せず残す。
 */
export function useChartBriefs(cids: string[]) {
  const [states, setStates] = useState<Record<string, ChartBrief | APIError>>(
    {}
  );
  // 404になったIDを保持するState
  const [notFoundCids, setNotFoundCids] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () =>
      "caches" in window ? window.caches.open("brief2") : null)().then(
      (cache) => {
        cids.forEach(async (cid) => {
          // 既に404として処理されているIDはスキップ
          if (notFoundCids.has(cid)) return;

          const briefPath = `/api/brief/${cid}`;

          // 0. 旧バージョンのnikochanが保存したキャッシュデータ
          let cachedData: ChartBrief | null = await migrateFromOldCache(cid);
          let isStale = true;

          // 1. CacheStorageの確認
          try {
            const cachedRes = await cache?.match(briefPath);
            if (cachedRes) {
              const fetchedAt = Number(
                cachedRes.headers.get("x-fetched-at") || "0"
              );
              cachedData = await cachedRes.json();
              // 経過時間がTTL以内なら「新しい」とみなす
              if (Date.now() - fetchedAt < 600) {
                isStale = false;
              }
            }
          } catch (e) {
            console.error("CacheStorage read failed", e);
            Sentry.withScope((scope) => {
              scope.setTransactionName("common/briefCache");
              Sentry.captureException(e);
            });
          }

          if (cachedData) {
            setStates((prev) => {
              if (cid in prev) {
                return prev;
              } else {
                return { ...prev, [cid]: cachedData };
              }
            });
          }

          // 3. データが古い(stale) または キャッシュがない場合はfetchを行う
          if (isStale) {
            // 同じURLに対するリクエストが既に走っていないかチェック（複数コンポーネント同時実行対策）
            if (!pendingFetches.has(cid)) {
              const fetchPromise = fetch(
                process.env.BACKEND_PREFIX + briefPath,
                {
                  cache: "default",
                }
              )
                .then(
                  async (res) => {
                    if (res.ok) {
                      // レスポンスをクローンし、取得時刻ヘッダーを付与してキャッシュに保存
                      const resToCache = res.clone();
                      const headers = new Headers(resToCache.headers);
                      headers.set("x-fetched-at", Date.now().toString());
                      const cacheRes = new Response(resToCache.body, {
                        status: resToCache.status,
                        statusText: resToCache.statusText,
                        headers: headers,
                      });
                      await cache?.put(briefPath, cacheRes);
                      return (await res.json()) as ChartBrief;
                    } else {
                      if (res.status === 404) {
                        await cache?.delete(briefPath); // キャッシュからも削除
                      }
                      return await APIError.fromRes(res);
                    }
                  },
                  (e) => APIError.fetchError(e)
                )
                .catch((e) => APIError.badResponse(e));

              pendingFetches.set(briefPath, fetchPromise);

              // fetch完了後にMapから削除
              fetchPromise.finally(() => {
                pendingFetches.delete(briefPath);
              });
            }

            // 重複排除されたPromiseを待つ
            const result = await pendingFetches.get(briefPath)!;

            // 4. fetch結果に応じた処理
            if (result instanceof APIError) {
              if (result.status === 404) {
                setNotFoundCids((prev) => new Set(prev).add(cid));
              } else {
                // キャッシュが「ない」場合のみエラー表示。
                // キャッシュが「ある」場合は何もしないことで古いデータを維持する。
                if (!cachedData) {
                  setStates((prev) => ({ ...prev, [cid]: result }));
                }
              }
            } else {
              // fetch成功時、取得した最新データで再レンダリング
              setStates((prev) => ({ ...prev, [cid]: result }));
            }
          }
        });
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cids.join(",")]);

  // --- 返り値のフォーマット ---
  // 404になったものを除外し、(Data | loading | エラー) の配列を生成
  const results: (undefined | ChartBrief | APIError)[] = cids
    .filter((cid) => !notFoundCids.has(cid))
    .map((cid) => states[cid]);

  return {
    results,
    notFoundCids: Array.from(notFoundCids), // 呼び出し元でlocalStorageなどを更新するための配列
  };
}
