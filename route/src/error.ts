import { Context } from "hono";
import { backendOrigin, Bindings, ResponseOK } from "./env.js";
import { HTTPException } from "hono/http-exception";
import { env } from "hono/adapter";
import { matchedRoutes } from "hono/route";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import * as v from "valibot";
import { ContentfulStatusCode } from "hono/utils/http-status";
import type { captureException } from "@sentry/hono/node";

export function notFound(): never {
  throw new HTTPException(404);
}
export function fetchError(e: Bindings) {
  return (err: unknown) => {
    if (e.IS_SERVICE_WORKER) {
      // @ts-expect-error 499 is not standard HTTP status code
      throw new HTTPException(499, { message: "fetchError", cause: err });
    } else {
      throw new HTTPException(502, { cause: err });
    }
  };
}
/**
 * validation error時にValiErrorにしてthrowするだけのhook
 */
export function sValidatorHook() {
  return (
    e:
      | { success: true }
      | {
          success: false;
          error: readonly unknown[]; // readonly Issue[] だが正しいimport方法がわからない & 結局キャスト必要
        }
  ) => {
    if (!e.success) {
      throw new v.ValiError([...e.error] as [
        v.BaseIssue<unknown>,
        ...v.BaseIssue<unknown>[],
      ]);
    }
  };
}

/**
 * APIの異常時のレスポンスはjsonで `{message: "事前に定義されたメッセージ"}` の形式でなければならない。
 * メッセージは `i18n/{ja,en}/error.js` 内の`api`に定義されているものでなければならない。
 *
 * このエラーハンドラーはthrowされた例外を上記のレスポンスフォーマットに整形する。
 * したがってそれぞれのrouteで想定外のエラーをcatchして500レスポンスなどにする必要はない。
 * * `HTTPException(4xx, {message: "事前に定義されたメッセージ"})` をthrowするとそのメッセージをそのまま返す。
 * * `ValiError` をthrowするか、HTTPExceptionの`cause`に渡すと、`message`に加えてvalibotのissueを含んだレスポンスを返す。
 *    したがってそれぞれのAPIのハンドラーでは常に `v.parse()` を使用し、catchしたり手動でjsonにして返す必要はない
 * * `hono-openapi` のvalidatorを使用する場合は第3引数に `sValidatorHook()` を渡すことで
 *    バリデーションエラーが上記のValiErrorの処理と同じロジックに流れる。
 * * cause に Response を含むエラーをthrowするとそのbodyをパースし、JSON形式で message が含まれていればそれを返す。
 */
export const onError =
  (config: {
    fetchStatic: (e: Bindings, url: URL) => Promise<ResponseOK>;
    isTest?: boolean;
    captureException: typeof captureException | null;
    setTransactionName: ((name: string) => undefined) | null;
  }) =>
  async (err: unknown, c: Context) => {
    // routeハンドラーのあとにmiddlewareがある場合があり、routePath(c, -1)で正しく取得できないので、
    // pathが最長のハンドラーを採用する
    const route = matchedRoutes(c)
      .sort((a, b) => a.path.length - b.path.length)
      .at(-1);
    if (route && config.setTransactionName) {
      config.setTransactionName(`${route.method} ${route.path}`);
    }
    try {
      const lang = c.get("language") || "en";
      let status: ContentfulStatusCode = 500;
      let message: string = "";
      let others: object = {}; // レスポンスに含まれる
      let extra: object = {}; // レスポンスに含まれない、Sentryに送られる
      if (v.isValiError(err)) {
        status = 400;
        others = {
          flattened: v.flatten(err.issues),
          issues: err.issues,
        };
      } else if (err instanceof HTTPException) {
        status = err.status;
        message = err.message;
        err.name = `HTTPException-${status}`;
      }
      if (err instanceof Error && v.isValiError(err.cause)) {
        others = {
          flattened: v.flatten(err.cause.issues),
          issues: err.cause.issues,
        };
      }
      if (err instanceof Error && err.cause instanceof Response) {
        status = err.cause.status as ContentfulStatusCode;
        try {
          const bodyText = await err.cause.text();
          try {
            const body = JSON.parse(bodyText);
            if (body && typeof body === "object" && "message" in body) {
              message = String(body.message);
              others = body;
            } else {
              extra = { body };
            }
          } catch {
            extra = { body: bodyText };
          }
        } catch (e) {
          extra = { bodyReadError: String(e) };
        }
      }

      const messageFallbacks: Record<number, string> = {
        400: "badRequest",
        404: "notFound",
        500: "unknownApiError",
      };
      message = message || messageFallbacks[status] || "";

      if (status >= 500) {
        config.captureException?.(err, {
          extra: {
            status,
            message,
            ...others,
            ...extra,
          },
        });
      }

      if (c.req.path.startsWith("/api") || c.req.path.startsWith("/og")) {
        return c.json(
          {
            message,
            ...others,
          },
          status
        );
      } else {
        if (/\/errorPlaceholder/.test(c.req.path)) {
          // エラーハンドラーがfetchに失敗して無限ループになるのを防ぐ
          c.var.logger.warn("Fallback to plain error placeholder message.");
          return c.text("Error PLACEHOLDER_STATUS: PLACEHOLDER_MESSAGE");
        } else {
          return c.body(
            await errorResponse(
              config.fetchStatic,
              c.var.logger,
              env(c),
              backendOrigin(c),
              lang,
              status,
              message
            ),
            status,
            { "Content-Type": "text/html; charset=utf-8" }
          );
        }
      }
    } catch (e) {
      c.var.logger.error(e);
      config.captureException?.(e, { extra: { err: String(err) } });
      return c.body(null, 500);
    }
  };

async function errorResponse(
  fetchStatic: (e: Bindings, url: URL) => Promise<ResponseOK>,
  logger: typeof console,
  e: Bindings,
  origin: string,
  lang: string,
  status: number,
  message: string
) {
  const t = await getTranslations(lang, "error");
  return await fetchStatic(e, new URL(`/${lang}/errorPlaceholder`, origin))
    .then(
      (res) => res.text(),
      (e) => {
        logger.error(e);
        logger.warn("Fallback to plain error placeholder message.");
        return "Error PLACEHOLDER_STATUS: PLACEHOLDER_MESSAGE";
      }
    )
    .then((text) =>
      text
        .replaceAll("PLACEHOLDER_STATUS", String(status))
        .replaceAll(
          "PLACEHOLDER_MESSAGE",
          t.has("api." + message)
            ? t("api." + message)
            : status === 400
              ? t("api.badRequest")
              : status === 404
                ? t("api.notFound")
                : message || t("unknownApiError")
        )
        .replaceAll("PLACEHOLDER_TITLE", status == 404 ? "Not Found" : "Error")
    );
  // _next/static/chunks/errorPlaceholder のほうには置き換え処理するべきものはなさそう
}

export async function errorLiteral(...message: string[]) {
  const t = await getTranslations("en", "error");
  if (message.some((m) => !t.has("api." + m))) {
    throw new Error("Unknown error message key in " + message);
  }
  return v.object({
    message: v.union([...message.map((m) => v.literal(m))]),
  });
}

export async function validationErrorSchema(m: string = "badRequest") {
  const t = await getTranslations("en", "error");
  if (!t.has("api." + m)) {
    throw new Error("Unknown error message key in " + m);
  }
  return v.object({
    message: v.literal(m),
    flattened: v.pipe(
      v.object({
        root: v.optional(v.unknown()),
        nested: v.optional(v.unknown()),
        other: v.optional(v.unknown()),
      }),
      v.description("Flattened error messages of issues")
    ),
    issues: v.pipe(
      v.array(v.unknown()),
      v.description("raw issues from Valibot")
    ),
  });
}
