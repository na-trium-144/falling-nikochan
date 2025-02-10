import { Hono } from "hono";
import { languageDetector } from "hono/language";
import apiApp from "./api/app.js";
import { Bindings } from "./env.js";
import briefApp from "./api/brief.js";
import { ChartBrief, pageTitle } from "../chartFormat/chart.js";
import { fetchStatic } from "./static.js";

async function errorResponse(
  origin: string,
  lang: string,
  status: number,
  message: string
) {
  return (
    await (
      await fetchStatic(new URL(`/${lang}/errorPlaceholder`, origin))
    ).text()
  )
    .replaceAll("PLACEHOLDER_STATUS", String(status))
    .replaceAll("PLACEHOLDER_MESSAGE", message)
    .replaceAll("PLACEHOLDER_TITLE", status == 404 ? "Not Found" : "Error");
  // _next/static/chunks/errorPlaceholder のほうには置き換え処理するべきものはなさそう
}

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .route("/api", apiApp)
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
  .notFound(async (c) => {
    const lang = c.get("language");
    // return c.body(
    //   (await fetchStatic(new URL(`/${lang}/404`, new URL(c.req.url).origin)))
    //     .body!,
    //   404,
    //   { "Content-Type": "text/html" }
    // );
    return c.body(
      await errorResponse(new URL(c.req.url).origin, lang, 404, "Not Found"),
      404,
      { "Content-Type": "text/html" }
    );
  })
  .onError(async (err, c) => {
    console.error(err);
    const lang = c.get("language");
    if (c.req.path.startsWith("/api")) {
      return c.json({ message: "Server Error" }, 500);
    } else {
      return c.body(
        await errorResponse(
          new URL(c.req.url).origin,
          lang,
          500,
          "Server Error"
        ),
        500,
        { "Content-Type": "text/html" }
      );
    }
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
  .on(
    "get",
    [
      "/share/:cid{[0-9]+}",
      // "/share/:cid_txt{[0-9]+\\.txt}",
      "_next/static/chunks/app/:locale/share/:cid{[0-9]+}/:f",
    ],
    async (c) => {
      const lang = c.get("language");
      const cid = c.req.param("cid"); /*|| c.req.param("cid_txt").slice(0, -4)*/
      const pBriefRes = briefApp.request(`/${cid}`);
      let placeholderUrl: URL;
      if (c.req.path.startsWith("/share")) {
        placeholderUrl = new URL(
          `/${lang}/share/placeholder`,
          new URL(c.req.url).origin
        );
      } else {
        placeholderUrl = new URL(
          c.req.url.replace(/share\/[0-9]+/, "share/placeholder")
        );
      }
      const pRes = fetchStatic(placeholderUrl);
      const briefRes = await pBriefRes;
      if (briefRes.ok) {
        const brief = (await briefRes.json()) as ChartBrief;
        const res = await pRes;
        const replacedBody = (await res.text())
          .replaceAll("/share/placeholder", `/share/${cid}`)
          .replaceAll("PLACEHOLDER_TITLE", pageTitle(cid, brief))
          .replaceAll(
            '"PLACEHOLDER_BRIEF"',
            JSON.stringify(JSON.stringify(brief))
          );
        return c.text(replacedBody, 200, {
          "Content-Type": res.headers.get("Content-Type") || "text/plain",
          "Cache-Control": "no-store",
        });
      } else {
        if (c.req.routePath === "/share/:cid{[0-9]+}") {
          let message = "";
          try {
            message =
              ((await briefRes.json()) as { message?: string }).message || "";
          } catch {
            //
          }
          return c.body(
            await errorResponse(
              new URL(c.req.url).origin,
              lang,
              briefRes.status,
              message
            ),
            briefRes.status as 401 | 404 | 500,
            { "Content-Type": "text/html" }
          );
          // _next/static/chunks/errorPlaceholder のほうには置き換え処理するべきものはなさそう
        } else {
          return c.notFound();
        }
      }
    }
  );

export default app;
