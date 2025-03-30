import { Context, Hono } from "hono";
import { Bindings, languageDetector } from "./env.js";

// 307リダイレクトの際にoriginを指定しないと、iOSのPWA内でページを開けませんという画面になる。なんでやねん。

const redirectApp = (config?: {
  languageDetector?: (c: Context, next: () => Promise<void>) => Promise<void>;
}) =>
  new Hono<{ Bindings: Bindings }>({ strict: false })
    .use(config?.languageDetector || languageDetector())
    .get("/edit/:cid", (c) => {
      // deprecated (used until ver6.15)
      const cid = c.req.param("cid");
      return c.redirect(`${new URL(c.req.url).origin}/edit?cid=${cid}`, 301);
    })
    .on("get", ["/", "/edit", "/main/*", "/play"], (c) => {
      const lang = c.get("language");
      const params = new URLSearchParams(new URL(c.req.url).search);
      return c.redirect(
        `${new URL(c.req.url).origin}/${lang}${c.req.path}${params ? "?" + params : ""}`,
        307,
      );
    });

export default redirectApp;
