import { Hono } from "hono";
import { cors } from "hono/cors";
import briefApp from "./brief";
import { Bindings } from "../env";
import chartFileApp from "./chartFile";
import latestApp from "./latest";
import newChartFileApp from "./newChartFile";
import seqFileApp from "./seqFile";

const apiApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .use("/*", cors())
  .route("/brief", briefApp)
  .route("/chartFile", chartFileApp)
  .route("/newChartFile", newChartFileApp)
  .route("/seqFile", seqFileApp)
  .route("/latest", latestApp);

export default apiApp;
