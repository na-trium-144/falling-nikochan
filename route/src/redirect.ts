import { Context, Hono } from "hono";
import { Bindings, languageDetector } from "./env.js";
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
      return c.redirect(`${new URL(c.req.url).origin}/edit?cid=${cid}`, 301);
    })
    .on("get", ["/", "/edit", "/main/*", "/play"], (c) => {
      const params = new URLSearchParams(new URL(c.req.url).search);
      const lang = c.get("language");
      const redirected = `${new URL(c.req.url).origin}/${lang}${c.req.path}${params ? "?" + params : ""}`;
      if (isbot(c.req.header("User-Agent"))) {
        // crawlerに対してはリダイレクトのレスポンスを返す代わりにリダイレクト先のページを直接返す
        return config.fetchStatic(env(c), new URL(redirected));
      }
      return c.redirect(redirected, 307);
    });

export default redirectApp;
