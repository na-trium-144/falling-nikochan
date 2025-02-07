import { Hono } from "hono";
import { cors } from "hono/cors";
import briefApp from "./brief.js";
import { Bindings } from "../env.js";
import chartFileApp from "./chartFile.js";
import latestApp from "./latest.js";
import newChartFileApp from "./newChartFile.js";
import seqFileApp from "./seqFile.js";
import hashPasswdApp from "./hashPasswd.js";

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
  .route("/seqFile", seqFileApp)
  .route("/latest", latestApp)
  .route("/hashPasswd", hashPasswdApp);

export default apiApp;
