import {
  Bindings,
  cacheControl,
  fetchStatic,
  languageDetector,
} from "./env.js";
import briefApp from "./api/brief.js";
import { getTranslations } from "@falling-nikochan/i18n";
import {
  baseScoreRate,
  bigScoreRate,
  chainScoreRate,
  ChartBrief,
  deserializeResultParams,
  levelTypes,
  ResultParams,
} from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";
import packageJson from "../package.json" with { type: "json" };
import { env } from "hono/adapter";
import { Hono } from "hono";

/*
OGPの見た目を優先するため、shareページではクエリのlangを優先する。
クエリのlangとaccept-languageが異なる場合、クライアントサイドでリダイレクトするように
bodyを無理やり書き換える。
*/

const shareApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .use(languageDetector())
  .get("/:cid{[0-9]+}", async (c) => {
    const lang = c.get("language");
    const qLang = c.req.query("lang") || lang;
    const cid = c.req.param("cid");
    // c.req.param("cid_txt").slice(0, -4) for /share/:cid_txt{[0-9]+.txt}
    const qResult = c.req.query("result");
    let resultParams: ResultParams | null = null;
    if (qResult) {
      try {
        resultParams = deserializeResultParams(qResult);
      } catch (e) {
        console.error(e);
        // throw new HTTPException(400, { message: "invalidResultParam" });
      }
    }
    const pBriefRes = briefApp.request(`/${cid}`);
    const t = await getTranslations(qLang, "share");
    const tr = await getTranslations(qLang, "play.result");
    let placeholderUrl: URL;
    // if (c.req.path.startsWith("/share")) {
    placeholderUrl = new URL(
      `/${qLang}/share/placeholder`,
      new URL(c.req.url).origin,
    );
    // } else {
    //   placeholderUrl = new URL(
    //     c.req.url.replace(/share\/[0-9]+/, "share/placeholder")
    //   );
    // }
    const pRes = fetchStatic(env(c), placeholderUrl);
    const briefRes = await pBriefRes;
    if (briefRes.ok) {
      const brief = (await briefRes.json()) as ChartBrief;
      const res = await pRes;
      let newTitle = brief.composer
        ? t("titleWithComposer", {
            title: brief.title,
            composer: brief.composer,
            cid: cid,
          })
        : t("title", {
            title: brief.title,
            cid: cid,
          });
      if (resultParams) {
        newTitle = t("titleWithResult", {
          title: newTitle,
          date: resultParams.date.toLocaleDateString(qLang),
        });
      }
      let titleEscapedJsStr = ""; // "{...\"TITLE\"}" inside script tag
      let titleEscapedHtml = ""; // <title>TITLE</title>, "TITLE" inside meta tag
      for (let i = 0; i < newTitle.length; i++) {
        titleEscapedJsStr +=
          "\\\\u" + newTitle.charCodeAt(i).toString(16).padStart(4, "0");
        titleEscapedHtml += "&#" + newTitle.charCodeAt(i) + ";";
      }
      const newDescription = resultParams
        ? t("descriptionWithResult", {
            chartCreator: brief.chartCreator || t("chartCreatorEmpty"),
            title: brief.title,
            level:
              (resultParams.lvName ? resultParams.lvName + " " : "") +
              levelTypes[resultParams.lvType] +
              "-" +
              resultParams.lvDifficulty.toString(),
            score: (resultParams.score100 / 100).toString(),
            status:
              resultParams.chainScore100 === chainScoreRate * 100
                ? " (" + // additional space on left side
                  (resultParams.baseScore100 === baseScoreRate * 100
                    ? tr("perfect")
                    : tr("full")) +
                  (resultParams.bigScore100 === bigScoreRate * 100 ? "+" : "") +
                  "!)"
                : "",
          })
        : t("description", {
            chartCreator: brief.chartCreator || t("chartCreatorEmpty"),
            title: brief.title,
          });
      // キャッシュが正しく動作するように、クエリパラメータの順番が常に一定である必要がある
      const ogQuery = new URLSearchParams();
      ogQuery.set("lang", qLang);
      if (resultParams) ogQuery.set("result", qResult!);
      ogQuery.set("v", packageJson.version);
      let replacedBody = (await res.text())
        .replaceAll('/share/placeholder"', `/share/${cid}"`) // for canonical URL, but not chunk script tag
        .replaceAll('\\"PLACEHOLDER_TITLE', '\\"' + titleEscapedJsStr)
        .replaceAll("PLACEHOLDER_TITLE", titleEscapedHtml)
        .replaceAll(
          "https://placeholder_og_image/",
          // キャッシュ対策のためクエリにバージョンを入れ、ogの仕様変更した場合に再取得してもらえるようにする
          new URL(
            (resultParams ? `/og/result/${cid}?` : `/og/share/${cid}?`) +
              ogQuery.toString(),
            new URL(c.req.url).origin,
          ).toString(),
        )
        .replaceAll("PLACEHOLDER_DESCRIPTION", newDescription);
      // .replaceAll(
      //   // これはjsファイルの中にしか現れないのでエスケープの必要はない
      //   '"PLACEHOLDER_BRIEF"',
      //   JSON.stringify(JSON.stringify(brief))
      // );
      if (c.req.path.startsWith("/share") && lang !== qLang) {
        const q = new URLSearchParams(c.req.query());
        q.delete("lang");
        const newPath = c.req.path + (q.toString() ? "?" + q.toString() : "");
        replacedBody =
          replacedBody.slice(0, replacedBody.indexOf("<body")) +
          "<body><script>" +
          `location.replace("${newPath}");` +
          "</script></body></html>";
      }
      return c.text(replacedBody, 200, {
        "Content-Type": res.headers.get("Content-Type") || "text/plain",
        "Cache-Control": cacheControl(env(c), null),
      });
    } else {
      let message = "";
      try {
        message =
          ((await briefRes.json()) as { message?: string }).message || "";
      } catch {
        //
      }
      throw new HTTPException(briefRes.status as 401 | 404 | 500, { message });
    }
  });
export default shareApp;
