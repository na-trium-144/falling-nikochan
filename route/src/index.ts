import { Hono } from "hono";
import { languageDetector } from "hono/language";
import apiApp from "./api/app.js";
import { Bindings } from "./env.js";
import { fetchStatic } from "./static.js";
import { HTTPException } from "hono/http-exception";
import ogApp from "./og/app.js";
import shareHandler from "./share.js";
import { join, dirname } from "node:path";
import dotenv from "dotenv";
import { getTranslations } from "@falling-nikochan/i18n";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

async function errorResponse(
  origin: string,
  lang: string,
  status: number,
  message: string
) {
  const t = await getTranslations(lang, "error");
  return (
    await (
      await fetchStatic(new URL(`/${lang}/errorPlaceholder`, origin))
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

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .route("/api", apiApp)
  .route("/og", ogApp)
  // これより上はlanguageDetectorのcookieが入らない
  .use(
    languageDetector({
      supportedLanguages: ["en", "ja"],
      fallbackLanguage: "en",
      order: ["cookie", "header"],
      lookupCookie: "language",
      cookieOptions: {
        sameSite: "Lax",
        secure: process.env.API_ENV !== "development",
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
      },
      // debug: process.env.API_ENV === "development",
    })
  )
  .onError(async (err, c) => {
    console.error(err);
    try {
      const lang = c.get("language");
      if (!(err instanceof HTTPException)) {
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
          await errorResponse(new URL(c.req.url).origin, lang, status, message),
          status,
          { "Content-Type": "text/html" }
        );
      }
    } catch (e) {
      console.error("While handling the above error, another error thrown:", e);
      return c.body(null, 500);
    }
  })
  .notFound(() => {
    throw new HTTPException(404);
  })
  .get("/edit/:cid", (c) => {
    // deprecated (used until ver6.15)
    const cid = c.req.param("cid");
    return c.redirect(`/edit?cid=${cid}`, 301);
  })
  .on("get", ["/", "/edit", "/main/*", "/play"], (c) => {
    const lang = c.get("language");
    const params = new URLSearchParams(new URL(c.req.url).search);
    return c.redirect(
      `/${lang}${c.req.path}${params ? "?" + params : ""}`,
      307
    );
  })
  .get("/share/:cid{[0-9]+}", async (c, next) => {
    // @ts-expect-error TODO how to specify Variable type only for this middleware?
    c.set("cid", c.req.param("cid"));
    // c.req.param("cid_txt").slice(0, -4) for /share/:cid_txt{[0-9]+.txt}
    await next();
  })
  // .get(
  //   "/_next/static/chunks/app/:locale/share/:cid{[0-9]+}/:f",
  //   async (c, next) => {
  //     // @ts-expect-error TODO same as above
  //     c.set("cid", c.req.param("cid"));
  //     await next();
  //   }
  // )
  .get("/share/:cid{[0-9]+}", ...shareHandler)
  // .get(
  //   "/_next/static/chunks/app/:locale/share/:cid{[0-9]+}/:f",
  //   ...shareHandler
  // );

export default app;
