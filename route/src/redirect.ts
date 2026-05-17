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
      const q = new URLSearchParams(new URL(c.req.url).search);
      const cid = c.req.param("cid");
      q.set("cid", cid);
      return c.redirect(new URL(`/edit?${q}`, backendOrigin(c)), 301);
    })
    .get("/:lang/main/:sort{latest|popular}", (c) => {
      // deprecated (used until ver15.3)
      const q = new URLSearchParams(new URL(c.req.url).search);
      const lang = c.req.param("lang");
      const sort = c.req.param("sort");
      q.set("sort", sort);
      return c.redirect(
        new URL(`/${lang}/main/play?${q}`, backendOrigin(c)),
        301
      );
    })
    .get("/:lang/main/about/:page{[1-5]}", (c) => {
      // deprecated (used until ver15.12)
      const q = new URLSearchParams(new URL(c.req.url).search);
      const lang = c.req.param("lang");
      const page = Number(c.req.param("page"));
      switch (page) {
        case 1:
        case 2:
          return c.redirect(
            new URL(`/${lang}?${q}#feature-play`, backendOrigin(c)),
            301
          );
        case 3:
          return c.redirect(
            new URL(`/${lang}?${q}#feature-edit`, backendOrigin(c)),
            301
          );
        case 4:
        case 5:
          return c.redirect(
            new URL(`/${lang}/main/about?${q}`, backendOrigin(c)),
            301
          );
        default:
          return c.notFound();
      }
    })
    .on("get", ["/", "/edit", "/main/*", "/play"], async (c) => {
      const q = new URLSearchParams(new URL(c.req.url).search);
      const lang = c.get("language");
      const redirected = new URL(
        `/${lang}${c.req.path}?${q}`,
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
