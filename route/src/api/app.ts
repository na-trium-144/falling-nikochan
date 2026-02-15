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
import { fileMaxSize } from "@falling-nikochan/chart";
import { openAPIRouteHandler } from "hono-openapi";
import packageJson from "../../package.json" with { type: "json" };
import { Scalar } from "@scalar/hono-api-reference";
import { ConnInfo } from "hono/conninfo";
import ytMetaApp from "./ytMeta.js";
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
    .route("/record", recordApp);
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
    })
  );

  return apiApp;
};

export default apiApp;
