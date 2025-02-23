import { Hono } from "hono";
import { languageDetector } from "hono/language";
import apiApp from "./api/app.js";
import { Bindings } from "./env.js";
import briefApp from "./api/brief.js";
import { ChartBrief } from "../chartFormat/chart.js";
import { fetchStatic } from "./static.js";
import { getTranslations } from "../i18n/i18n.js";
import { HTTPException } from "hono/http-exception";

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
  .onError(async (err, c) => {
    console.error(err);
    const lang = c.get("language");
    if (!(err instanceof HTTPException)) {
      console.error(err);
      err = new HTTPException(500, { message: "Server Error" });
    }
    if (c.req.path.startsWith("/api")) {
      return c.json(
        { message: await (err as HTTPException).getResponse().text() },
        (err as HTTPException).status
      );
    } else {
      return c.body(
        await errorResponse(
          new URL(c.req.url).origin,
          lang,
          (err as HTTPException).status,
          await (err as HTTPException).getResponse().text()
        ),
        (err as HTTPException).status,
        { "Content-Type": "text/html" }
      );
    }
  })
  .notFound(() => {
    throw new HTTPException(404, { message: "Not Found" });
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
      const t = await getTranslations(lang, "share");
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
        const newTitle = brief.composer
          ? t("titleWithComposer", {
              title: brief.title,
              composer: brief.composer,
              chartCreator: brief.chartCreator,
              cid: cid,
            })
          : t("title", {
              title: brief.title,
              chartCreator: brief.chartCreator,
              cid: cid,
            });
        let titleEscapedJsStr = ""; // "{...\"TITLE\"}" inside script tag
        let titleEscapedHtml = ""; // <title>TITLE</title>, "TITLE" inside meta tag
        for (let i = 0; i < newTitle.length; i++) {
          titleEscapedJsStr +=
            "\\\\u" + newTitle.charCodeAt(i).toString(16).padStart(4, "0");
          titleEscapedHtml += "&#" + newTitle.charCodeAt(i) + ";";
        }
        const replacedBody = (await res.text())
          .replaceAll("/share/placeholder", `/share/${cid}`)
          .replaceAll('\\"PLACEHOLDER_TITLE', '\\"' + titleEscapedJsStr)
          .replaceAll("PLACEHOLDER_TITLE", titleEscapedHtml)
          .replaceAll(
            // これはjsファイルの中にしか現れないのでエスケープの必要はない
            '"PLACEHOLDER_BRIEF"',
            JSON.stringify(JSON.stringify(brief))
          );
        return c.text(replacedBody, 200, {
          "Content-Type": res.headers.get("Content-Type") || "text/plain",
          "Cache-Control": "no-store",
        });
      } else {
        let message = "";
        try {
          message =
            ((await briefRes.json()) as { message?: string }).message || "";
        } catch {
          //
        }
        throw new HTTPException(briefRes.status as 401 | 404 | 500, {
          message,
        });
      }
    }
  );

export default app;
