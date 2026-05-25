import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import AbortAddon from "wretch/addons/abort";
import { dedupe, retry } from "wretch/middlewares";
import * as Sentry from "@sentry/nextjs";
import { ABORT_ERROR_STATUS, APIError, FETCH_ERROR_STATUS } from "./apiError";

/**
 * wretchのwrapper
 *
 * originを環境変数に従って変更したりfetchErrorをラップしたりなどのアプリ全体で共通で使われるヘルパーメソッドを適用した状態のwretchインスタンスを返す。
 *
 * fetchBackend()
 *  .get("/foo")
 *  .notFound(markAsExpected) // Sentryに送らなくて良い想定内のエラーをハンドル
 *  .json((res) => ...)
 *  // 以下optional:
 *  .catch((e) => captureAndWrap(e)) // 想定外のエラーはErrorクラスでラップしてSentryに送りreturnする
 *  .then((result_or_error) => ...)
 *
 * のように使う。
 *
 * fetchがエラーを投げたときと、レスポンスが4xxや5xxだった場合は APIError がthrowされる。
 *
 * 想定内のエラーがない場合はcatch()しなくてもよい。
 * その場合はunhandledrejectionとして自動でSentryがキャッチし、整形してイベントとして送信される。
 * (ネットワークエラーとAbortErrorはいずれの場合でもexpectedとしてマークされSentry送信の対象外)
 */
export function fetchBackend() {
  const referenceError = { stack: "" };
  Error.captureStackTrace(referenceError, fetchBackend);
  return wretch(process.env.BACKEND_PREFIX || window.location.origin)
    .addon(QueryStringAddon)
    .addon(AbortAddon())
    .middlewares([dedupe()])
    .customError(APIErrorTransformer(referenceError));
}
export function fetchAsset() {
  const referenceError = { stack: "" };
  Error.captureStackTrace(referenceError, fetchAsset);
  return wretch(process.env.ASSET_PREFIX || window.location.origin)
    .middlewares([
      dedupe(),
      retry({
        // fetching static asset should not fail. infinite retry with error report
        maxAttempts: 0,
        until: (response) => !!response && response.ok,
        onRetry: async ({ response, url }) => {
          if (!response) {
            // network error, do not report
          } else {
            let message: string;
            try {
              message = await response.text();
            } catch {
              message = response.statusText;
            }
            const we = new wretch.WretchError(message);
            we.cause = referenceError;
            // we.stack += "\nCAUSE: " + referenceError.stack;
            we.response = response;
            we.status = response.status;
            we.url = url;
            Sentry.captureException(we);
          }
          return {};
        },
        retryOnNetworkError: true,
      }),
    ])
    .customError(APIErrorTransformer(referenceError));
}

function APIErrorTransformer(referenceError: { stack: string }) {
  return async (
    we: unknown,
    res: Response | undefined,
    req: { _url: string }
  ): Promise<APIError> => {
    const status =
      we instanceof wretch.WretchError
        ? we.status
        : we instanceof DOMException && we.name === "AbortError"
          ? ABORT_ERROR_STATUS
          : FETCH_ERROR_STATUS;
    let message: string;
    let body: unknown = undefined;
    if (!res) {
      if (status === FETCH_ERROR_STATUS) {
        // fetchErrorはユーザー向けメッセージがある
        message = "fetchError";
      } else {
        message = String(we);
      }
      body = {
        error: String(we),
        ...(we && typeof we === "object" ? we : {}),
      };
    } else {
      try {
        const bodyText = await res.text();
        try {
          body = JSON.parse(bodyText);
          if (body && typeof body === "object" && "message" in body) {
            message = String(body.message);
          } else {
            message = bodyText.slice(0, 50);
          }
        } catch {
          body = bodyText;
          // cloudflareが返すエラーレスポンスのHTMLとかの可能性を考慮
          // HTMLでなかった場合はbodyそのまま(長すぎる場合はslice)
          message =
            bodyText.match(/<title>\s*([\s\S]*?)\s*<\/title>/i)?.[1] ??
            bodyText.slice(0, 50);
        }
      } catch (e) {
        body = String(e);
        message = "(Failed to parse body of error response)";
      }
    }
    return new APIError(req._url, status, message, referenceError.stack, body);
  };
}

/**
 * エラーをSentryに報告する。
 * 引数がErrorクラス型でない場合Errorクラスでラップし、そのエラーをreturnする。
 */
export function captureAndWrap(
  e: unknown,
  extra?: Record<string, unknown>
): Error {
  if (!(e instanceof Error)) {
    e = new Error(String(e));
    Error.captureStackTrace(e as Error, captureAndWrap);
  }
  if (!(e as Error).stack) {
    Error.captureStackTrace(e as Error, captureAndWrap);
  }
  Sentry.captureException(e, { extra });
  console.error(e, { extra });
  return e as Error;
}

export function formatErrorMsg(
  e: Error,
  t: { (key: string): string; has: (key: string) => boolean }
) {
  if (e instanceof APIError) {
    return e.formatMsg(t);
  } else {
    return t("badResponse");
  }
}
export function formatError(
  e: Error,
  t: { (key: string): string; has: (key: string) => boolean }
) {
  if (e instanceof APIError) {
    return e.format(t);
  } else {
    return t("badResponse");
  }
}
export function isExpectedError(e: Error): boolean {
  if (e instanceof APIError) {
    return e.expected;
  } else {
    return false;
  }
}
