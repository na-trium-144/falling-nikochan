import { Hono } from "hono";
import apiApp from "./api/app";

const app = new Hono().route("/api", apiApp);

export default app;
