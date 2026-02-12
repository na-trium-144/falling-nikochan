import { Context, Hono } from "hono";
import { backendOrigin, Bindings, languageDetector } from "./env.js";
import { isbot } from "isbot";
import { env } from "hono/adapter";

// 307リダイレクトの際にoriginを指定しないと、iOSのPWA内でページを開けませんという画面になる。なんでやねん。

const redirectApp = (config: {
  languageDetector?: (c: Context, next: () => Promise<void>) => Promise<void>;
  fetchStatic: (e: Bindings, url: URL) => Response | Promise<Response>;
}) =>
  new Hono<{ Bindings: Bindings }>({ strict: false })
    .use(config?.languageDetector || languageDetector())
    .get("/edit/:cid", (c) => {
      // deprecated (used until ver6.15)
      const cid = c.req.param("cid");
      return c.redirect(new URL(`/edit?cid=${cid}`, backendOrigin(c)), 301);
    })
    .on("get", ["/", "/edit", "/main/*", "/play"], async (c) => {
      const params = new URLSearchParams(new URL(c.req.url).search);
      const lang = c.get("language");
      const redirected = new URL(
        `/${lang}${c.req.path}${params ? "?" + params : ""}`,
        backendOrigin(c)
      );
      if (isbot(c.req.header("User-Agent"))) {
        // crawlerに対してはリダイレクトのレスポンスを返す代わりにリダイレクト先のページを直接返す
        const res = await config.fetchStatic(env(c), new URL(redirected));
        if (res.ok) {
          return c.body(res.body as ReadableStream, 200, {
            "Content-Type": res.headers.get("Content-Type") || "text/html",
            "Cache-Control": "no-store",
          });
        }
      }
      return c.redirect(redirected, 307);
    });

export default redirectApp;
