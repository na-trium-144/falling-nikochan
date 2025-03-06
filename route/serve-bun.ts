import { serveStatic } from "hono/bun";
import app from "./src/index.js";

const port = 8787;

app.use(
  "/*",
  serveStatic({
    root: "../frontend/out",
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
