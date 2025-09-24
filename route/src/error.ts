import { Context } from "hono";
import { Bindings } from "./env.js";
import { ValiError } from "valibot";
import { HTTPException } from "hono/http-exception";
import { env } from "hono/adapter";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import * as v from "valibot";

export function notFound(): Response {
  throw new HTTPException(404);
}
export const onError =
  (config: {
    fetchStatic: (e: Bindings, url: URL) => Response | Promise<Response>;
  }) =>
  async (err: any, c: Context) => {
    console.error(`Error: ${err} in ${c.req.path}`);
    try {
      const lang = c.get("language") || "en";
      if (err instanceof TypeError) {
        err = new HTTPException(502, { message: "fetchError" });
      } else if (err instanceof ValiError) {
        err = new HTTPException(400, { message: err.message });
      } else if (!(err instanceof HTTPException)) {
        err = new HTTPException(500);
      }
      const status = (err as HTTPException).status;
      const message =
        (await (err as HTTPException).getResponse().text()) ||
        (status === 404 ? "notFound" : "");
      if (c.req.path.startsWith("/api") || c.req.path.startsWith("/og")) {
        return c.json({ message }, status);
      } else {
        return c.body(
          await errorResponse(
            config.fetchStatic,
            env(c),
            new URL(c.req.url).origin,
            lang,
            status,
            message
          ),
          status,
          { "Content-Type": "text/html" }
        );
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
