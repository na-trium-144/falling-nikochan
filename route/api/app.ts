import { Hono } from "hono";
import { cors } from "hono/cors";

const apiApp = new Hono().use("/*", cors());

export default apiApp;
