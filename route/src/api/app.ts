import { Context, Hono, MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import briefApp from "./brief.js";
import { backendOrigin, Bindings } from "../env.js";
import chartFileApp from "./chartFile.js";
import newChartFileApp from "./newChartFile.js";
import playFileApp from "./playFile.js";
import seqFileApp from "./seqFile.js";
import seqPreviewApp from "./seqPreview.js";
import hashPasswdApp from "./hashPasswd.js";
import recordApp from "./record.js";
import { join, dirname } from "node:path";
import dotenv from "dotenv";
import searchApp from "./search.js";
import { bodyLimit } from "hono/body-limit";
import { docSchemas, fileMaxSize } from "@falling-nikochan/chart";
import { openAPIRouteHandler } from "hono-openapi";
import packageJson from "../../package.json" with { type: "json" };
import { Scalar } from "@scalar/hono-api-reference";
import { ConnInfo } from "hono/conninfo";
import ytMetaApp from "./ytMeta.js";
import { forwardCheckApp } from "./dbRateLimit.js";
import oembedApp from "./oembed.js";
import decompressMiddleware from "./decompress.js";
import { env } from "hono/adapter";
import { Db } from "mongodb";
import { etag } from "hono/etag";
import socialApp from "./social.js";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

export { getBrief } from "./brief.js";

const apiApp = async (config: {
  getConnInfo: (c: Context) => ConnInfo | null;
  dbMiddleware: MiddlewareHandler;
}) => {
  const prodCors = cors({
    origin: "*",
    credentials: false,
    // allowHeaders は指定しなければcors middlewareが自動ですべてのヘッダーを許可する
    exposeHeaders: ["*"],
  });
  const devCors = cors({
    origin: (origin) => origin,
    credentials: true,
    exposeHeaders: ["*"],
  });
  const apiApp = new Hono<{
    Bindings: Bindings;
    Variables: { db: () => Promise<Db> };
  }>({
    strict: false,
  })
    .use("/*", async (c, next) => {
      if (env(c).API_ENV === "development") {
        return devCors(c, next);
      } else {
        /*
        productionサーバーのcors設定ではcredentialsを渡せないようにしている。
        しかしdev環境のフロントエンドがcredentials(具体的にはクッキー)を含むリクエストを送った場合
        CORSエラーでTypeErrorになり、有用なエラーメッセージを表示することができない。
        そこで、credentialsを含むCORSリクエスト(カスタムヘッダーX-Credentialsで判別)の場合に限り
        CORSの制限をdevと同様にゆるくする代わりに418レスポンスを返す。
        クエリやAuthorizationヘッダー手動設定による認証はcredentialsに該当せず、対象外。
        */
        if (
          c.req.header("Origin") &&
          c.req.header("Origin") !== new URL(c.req.url).origin &&
          (c.req.header("X-Credentials") === "include" ||
            c.req
              .header("Access-Control-Request-Headers")
              ?.split(/\s*,\s*/)
              .some((h) => h.toLowerCase() === "x-credentials"))
        ) {
          if (c.req.method === "OPTIONS") {
            // OPTIONSリクエスト（プリフライト）は、CORSヘッダーを返すためにそのまま通過させる必要がある
            return devCors(c, next);
          } else {
            // 後続の処理（next）を呼ばずにその場でエラーを返す
            await devCors(c, async () => undefined);
            return c.json({ message: "noCORSCredentialsOnProd" }, 418);
          }
        } else {
          return prodCors(c, next);
        }
      }
    })
    .use(etag())
    .use(
      "/*",
      bodyLimit({
        maxSize: fileMaxSize,
        onError: (c) => {
          return c.json({ message: "tooLargeFile" }, 413);
        },
      })
    )
    .use("/*", decompressMiddleware)
    .use("/*", config.dbMiddleware)
    .route("/brief", await briefApp())
    .route("/ytMeta", ytMetaApp)
    .route(
      "/chartFile",
      await chartFileApp({ getConnInfo: config.getConnInfo })
    )
    .route(
      "/newChartFile",
      await newChartFileApp({ getConnInfo: config.getConnInfo })
    )
    .route("/seqFile", seqFileApp)
    .route("/seqPreview", seqPreviewApp)
    .route("/playFile", playFileApp)
    .get("/latest", (c) =>
      c.redirect(new URL("/api/search?sort=latest", backendOrigin(c)), 307)
    )
    .get("/popular", (c) =>
      c.redirect(new URL("/api/search?sort=popular", backendOrigin(c)), 307)
    )
    .route("/search", searchApp)
    .route("/hashPasswd", hashPasswdApp)
    .route("/record", await recordApp({ getConnInfo: config.getConnInfo }))
    .route("/ip", forwardCheckApp({ getConnInfo: config.getConnInfo }))
    .route("/oembed", oembedApp)
    .route("/social", socialApp)
    .get("/debug-sentry", () => {
      throw new Error("My first sentry error!");
    });
  apiApp.get(
    "/openapi.json",
    openAPIRouteHandler(apiApp, {
      documentation: {
        info: {
          title: "Falling Nikochan",
          version: packageJson.version,
          description:
            "API for Falling Nikochan, " +
            "a simple and cute rhythm game " +
            "where anyone can create and share charts.",
          license: {
            name: "MIT",
            identifier: "MIT",
            url: "https://opensource.org/licenses/MIT",
          },
        },
        components: {
          schemas: await docSchemas(),
        },
        servers: [
          ...(process.env.API_ENV === "development"
            ? [{ url: "/api", description: "Current Development Server" }]
            : []),
          {
            url: "https://nikochan.utcode.net/api",
            description: "Primary Server",
          },
        ],
      },
    })
  );
  apiApp.get(
    "/",
    Scalar({
      theme: "default",
      url: "/api/openapi.json",
      pageTitle: "Falling Nikochan API Reference",
      customCss: `
body {
  position: relative;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: var(--background-gradient);
  background-size: cover;
  background-repeat: no-repeat;
  z-index: -1;
}
.scalar-app, .references-rendered {
  background-color: unset !important;
}
.scalar-container > .scalar-client,
.z-context {
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
}
.light-mode,
.light-mode .dark-mode {
  --scalar-color-1: #000; /* fg-bright */
  --scalar-color-2: oklch(27.9% 0.041 260.031); /* fg-base: slate-800 */
  --scalar-color-3: oklch(27.9% 0.041 260.031); /* fg-base: slate-800 */
  --scalar-color-accent: oklch(48.8% 0.243 264.376); /* fn-link-3: blue-700 */
  --background-gradient: linear-gradient(to top, oklch(0.977 0.013 236.62) 0px, oklch(0.901 0.058 230.902) 100%);
  --scalar-background-1: rgba(255, 255, 255, 0.5);
  --scalar-background-2: rgba(255, 255, 255, 0.5);
  --scalar-background-3: rgba(255, 255, 255, 0.5);
  --scalar-background-accent: oklch(90.1% 0.058 230.902); /* fn-sky: sky-200 */
  --scalar-border-color: oklch(86.9% 0.022 252.894 / 0.8); /* fn-plain: slate-300 */
}
.dark-mode {
  --scalar-color-1: oklch(97% 0.001 106.424); /* stone-100 */
  --scalar-color-2: oklch(86.9% 0.005 56.366); /* stone-300 */
  --scalar-color-3: oklch(86.9% 0.005 56.366); /* stone-300 */
  --scalar-color-accent: oklch(62.3% 0.214 259.815); /* blue-500 */
  --background-gradient: linear-gradient(to top, oklch(0.266 0.079 36.259) 0px, rgb(32, 16, 10) 100%);
  --scalar-background-1: oklch(37.4% .01 67.558 / 0.5); /* stone-700 */
  --scalar-background-2: oklch(37.4% .01 67.558 / 0.5); /* stone-700 */
  --scalar-background-3: oklch(37.4% .01 67.558 / 0.5); /* stone-700 */
  --scalar-background-accent: oklch(21.6% 0.006 56.043 / 0.3); /* stone-900 */
}`,
    })
  );

  return apiApp;
};

export default apiApp;
