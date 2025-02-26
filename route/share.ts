import { createFactory } from "hono/factory";
import { Bindings } from "./env.js";
import briefApp from "./api/brief.js";
import { getTranslations } from "../i18n/i18n.js";
import { fetchStatic } from "./static.js";
import { ChartBrief } from "../chartFormat/chart.js";
import { HTTPException } from "hono/http-exception";

interface ShareParams {
  language: string;
  cid: string;
}

const factory = createFactory<{ Bindings: Bindings; Variables: ShareParams }>();
const shareHandler = factory.createHandlers(async (c) => {
  const lang = c.get("language");
  const cid = c.get("cid");
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
      message = ((await briefRes.json()) as { message?: string }).message || "";
    } catch {
      //
    }
    throw new HTTPException(briefRes.status as 401 | 404 | 500, {
      message,
    });
  }
});
export default shareHandler;
