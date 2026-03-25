import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import briefApp from "./brief.js";
import { Bindings } from "../env.js";
import chartFileApp from "./chartFile.js";
import latestApp from "./latest.js";
import newChartFileApp from "./newChartFile.js";
import playFileApp from "./playFile.js";
import seqFileApp from "./seqFile.js";
import seqPreviewApp from "./seqPreview.js";
import hashPasswdApp from "./hashPasswd.js";
import recordApp from "./record.js";
import { join, dirname } from "node:path";
import dotenv from "dotenv";
import popularApp from "./popular.js";
import searchApp from "./search.js";
import { bodyLimit } from "hono/body-limit";
import { docSchemas, fileMaxSize } from "@falling-nikochan/chart";
import { openAPIRouteHandler } from "hono-openapi";
import packageJson from "../../package.json" with { type: "json" };
import { Scalar } from "@scalar/hono-api-reference";
import { ConnInfo } from "hono/conninfo";
import ytMetaApp from "./ytMeta.js";
import { forwardCheckApp } from "./dbRateLimit.js";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

const apiApp = async (config: {
  getConnInfo: (c: Context) => ConnInfo | null;
}) => {
  const apiApp = new Hono<{ Bindings: Bindings }>({ strict: false })
    .use(
      "/*",
      cors({
        origin:
          process.env.API_ENV === "development" ? (origin) => origin : "*",
        credentials: process.env.API_ENV === "development",
        exposeHeaders: ["Retry-After"],
      })
    )
    .use(
      "/*",
      bodyLimit({
        maxSize: fileMaxSize,
        onError: (c) => {
          return c.json({ message: "tooLargeFile" }, 413);
        },
      })
    )
    .route("/brief", briefApp)
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
    .route("/latest", latestApp)
    .route("/popular", popularApp)
    .route("/search", searchApp)
    .route("/hashPasswd", hashPasswdApp)
    .route("/record", await recordApp({ getConnInfo: config.getConnInfo }))
    .route("/ip", forwardCheckApp({ getConnInfo: config.getConnInfo }));
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
