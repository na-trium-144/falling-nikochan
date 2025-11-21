import { Bindings, cacheControl, languageDetector } from "./env.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
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
import { Context, ExecutionContext, Hono } from "hono";

/*
OGPの見た目を優先するため、shareページではクエリのlangを優先する。
クエリのlangとaccept-languageが異なる場合、クライアントサイドでリダイレクトするように
bodyを無理やり書き換える。
*/

const shareApp = (config: {
  fetchBrief: (
    e: Bindings,
    cid: string,
    ctx: ExecutionContext | undefined
  ) => Response | Promise<Response>;
  fetchStatic: (e: Bindings, url: URL) => Response | Promise<Response>;
  languageDetector?: (c: Context, next: () => Promise<void>) => Promise<void>;
}) =>
  new Hono<{ Bindings: Bindings }>({ strict: false })
    .use(config.languageDetector || languageDetector())
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
      let executionCtx: ExecutionContext | undefined = undefined;
      try {
        executionCtx = c.executionCtx;
      } catch {
        //ignore
      }
      const pBriefRes = config.fetchBrief(env(c), cid, executionCtx);
      const t = await getTranslations(qLang, "share");
      const tr = await getTranslations(qLang, "play.result");
      let placeholderUrl: URL;
      // if (c.req.path.startsWith("/share")) {
      placeholderUrl = new URL(
        `/${qLang}/share/placeholder`,
        new URL(c.req.url).origin
      );
      // } else {
      //   placeholderUrl = new URL(
      //     c.req.url.replace(/share\/[0-9]+/, "share/placeholder")
      //   );
      // }
      const pRes = config.fetchStatic(env(c), placeholderUrl);
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
          if (resultParams.date) {
            newTitle = t("titleWithResult", {
              title: newTitle,
              date: resultParams.date.toLocaleDateString(qLang),
            });
          } else {
            newTitle = t("titleWithResultNoDate", {
              title: newTitle,
            });
          }
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
                    (resultParams.bigScore100 === bigScoreRate * 100
                      ? "+"
                      : "") +
                    "!)"
                  : "",
            })
          : t("description", {
              chartCreator: brief.chartCreator || t("chartCreatorEmpty"),
              title: brief.title,
            });
        const briefStr = JSON.stringify(brief);
        // キャッシュが正しく動作するように、クエリパラメータの順番が常に一定である必要がある
        const ogQuery = new URLSearchParams();
        ogQuery.set("lang", qLang);
        if (resultParams) ogQuery.set("result", qResult!);
        ogQuery.set("v", packageJson.version);
        let replacedBody = (await res.text())
          .replaceAll('/share/placeholder\\"', `/share/${cid}\\"`) // for canonical URL in script tag
          .replaceAll('/share/placeholder"', `/share/${cid}"`) // for canonical URL
          .replaceAll('\\"PLACEHOLDER_TITLE', '\\"' + escapeJs(newTitle)) // "{...\"TITLE\"}" inside script tag
          .replaceAll("PLACEHOLDER_TITLE", escapeHtml(newTitle)) // <title>TITLE</title>, "TITLE" inside meta tag
          .replaceAll(
            "https://placeholder_og_image/",
            // キャッシュ対策のためクエリにバージョンを入れ、ogの仕様変更した場合に再取得してもらえるようにする
            new URL(
              (resultParams ? `/og/result/${cid}?` : `/og/share/${cid}?`) +
                ogQuery.toString(),
              new URL(c.req.url).origin
            ).toString()
          )
          .replaceAll(
            '\\"PLACEHOLDER_DESCRIPTION',
            '\\"' + escapeJs(newDescription)
          )
          .replaceAll("PLACEHOLDER_DESCRIPTION", escapeHtml(newDescription))
          .replaceAll('\\"PLACEHOLDER_BRIEF', '\\"' + escapeJs(briefStr))
          .replaceAll("PLACEHOLDER_BRIEF", escapeHtml(briefStr));
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
        throw new HTTPException(briefRes.status as 401 | 404 | 500, {
          message,
        });
      }
    });

function escapeJs(str: string): string {
  let jsStr = "";
  for (let i = 0; i < str.length; i++) {
    jsStr += "\\\\u" + str.charCodeAt(i).toString(16).padStart(4, "0");
  }
  return jsStr;
}
function escapeHtml(str: string): string {
  let htmlStr = "";
  for (const codePoint of str) {
    htmlStr += "&#" + codePoint.codePointAt(0) + ";";
  }
  return htmlStr;
}

export default shareApp;
