import { Hono } from "hono";
import apiApp from "./api/app";
import { Bindings } from "./env";

const app = new Hono<{ Bindings: Bindings }>().route(
  "/api",
  apiApp
);

export default app;
