import { Hono } from "hono";
import { cors } from "hono/cors";
import briefApp from "./brief.js";
import { Bindings } from "../env.js";
import chartFileApp from "./chartFile.js";
import latestApp from "./latest.js";
import newChartFileApp from "./newChartFile.js";
import playFileApp from "./playFile.js";
import hashPasswdApp from "./hashPasswd.js";
import { HTTPException } from "hono/http-exception";

const apiApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .use(
    "/*",
    cors({
      origin: process.env.API_ENV === "development" ? (origin) => origin : "*",
      credentials: process.env.API_ENV === "development",
    })
  )
  .route("/brief", briefApp)
  .route("/chartFile", chartFileApp)
  .route("/newChartFile", newChartFileApp)
  .get("/seqFile/*", () => {
    throw new HTTPException(410, {
      message: "/api/seqFile is no longer supported",
    });
  })
  .route("/playFile", playFileApp)
  .route("/latest", latestApp)
  .route("/hashPasswd", hashPasswdApp);

export default apiApp;
