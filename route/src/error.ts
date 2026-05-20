import { Context } from "hono";
import { backendOrigin, Bindings } from "./env.js";
import { HTTPException } from "hono/http-exception";
import { env } from "hono/adapter";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import * as v from "valibot";
import { ContentfulStatusCode } from "hono/utils/http-status";

export function notFound(): Response {
  throw new HTTPException(404);
}
export function fetchError(e: Bindings) {
  return () => {
    if (e.IS_SERVICE_WORKER) {
      // @ts-expect-error 499 is not standard HTTP status code
      throw new HTTPException(499, { message: "fetchError" });
    } else {
      throw new HTTPException(502);
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
export const onError =
  (config: {
    fetchStatic: (e: Bindings, url: URL) => Response | Promise<Response>;
    isTest?: boolean;
  }) =>
  async (err: unknown, c: Context) => {
    if (err instanceof Error) {
      if (config.isTest) {
        console.log(`Error handler triggered in ${c.req.path}: ${err.message}`);
      } else {
        console.error(
          `Error handler triggered in ${c.req.path}: ${err.message}\n${err.cause}\n${err.stack}`
        );
      }
    } else {
      console.error(`Error handler triggered in ${c.req.path}: ${err}`);
    }
    try {
      const lang = c.get("language") || "en";
      let status: ContentfulStatusCode;
      let message: string = "";
      let others: object = {};
      if (v.isValiError(err)) {
        status = 400;
        others = {
          flattened: v.flatten(err.issues),
          issues: err.issues,
        };
      } else if (err instanceof HTTPException) {
        status = err.status;
        message = err.message;
        if (v.isValiError(err.cause)) {
          others = {
            flattened: v.flatten(err.cause.issues),
            issues: err.cause.issues,
          };
        }
      } else {
        status = 500;
      }

      const messageFallbacks: Record<number, string> = {
        400: "badRequest",
        404: "notFound",
        500: "unknownApiError",
      };
      message = message || messageFallbacks[status] || "";

      if (c.req.path.startsWith("/api") || c.req.path.startsWith("/og")) {
        return c.json(
          {
            message,
            ...others,
          },
          status
        );
      } else {
        if (c.req.path === `/${lang}/errorPlaceholder`) {
          // エラーハンドラーがfetchに失敗して無限ループになるのを防ぐ
          console.warn("Fallback to plain error placeholder message.");
          return c.text("Error PLACEHOLDER_STATUS: PLACEHOLDER_MESSAGE");
        } else {
          return c.body(
            await errorResponse(
              config.fetchStatic,
              env(c),
              backendOrigin(c),
              lang,
              status,
              message
            ),
            status,
            { "Content-Type": "text/html" }
          );
        }
      }
    } catch (e) {
      console.error("While handling the above error, another error thrown:", e);
      return c.body(null, 500);
    }
  };

async function errorResponse(
  fetchStatic: (e: Bindings, url: URL) => Response | Promise<Response>,
  e: Bindings,
  origin: string,
  lang: string,
  status: number,
  message: string
) {
  const t = await getTranslations(lang, "error");
  return (
    await (
      await fetchStatic(e, new URL(`/${lang}/errorPlaceholder`, origin))
    ).text()
  )
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
    .replaceAll("PLACEHOLDER_TITLE", status == 404 ? "Not Found" : "Error");
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
