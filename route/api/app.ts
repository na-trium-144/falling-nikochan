import { Hono } from "hono";
import { cors } from "hono/cors";
import briefApp from "./brief.js";
import { Bindings } from "../env.js";
import chartFileApp from "./chartFile.js";
import latestApp from "./latest.js";
import newChartFileApp from "./newChartFile.js";
import seqFileApp from "./seqFile.js";

const apiApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .use("/*", cors())
  .route("/brief", briefApp)
  .route("/chartFile", chartFileApp)
  .route("/newChartFile", newChartFileApp)
  .route("/seqFile", seqFileApp)
  .route("/latest", latestApp);

export default apiApp;
