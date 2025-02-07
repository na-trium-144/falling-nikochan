import "dotenv/config";
import { serveStatic } from "hono/bun";
import app from "./app.js";

const port = 8787;

app.use("/", serveStatic({ path: "./out/index.html" })).use(
  "/*",
  serveStatic({
    root: "./out",
    rewriteRequestPath: (path) => {
      if (path.match(/\/[^/]+\.[^/]+$/)) {
        // path with extension
        return path;
      } else if (path.endsWith("/")) {
        return path.slice(0, -1) + ".html";
      } else {
        return path + ".html";
      }
    },
  })
);

export default {
  port: port,
  fetch: app.fetch,
};
