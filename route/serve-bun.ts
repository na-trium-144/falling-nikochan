import { serveStatic } from "hono/bun";
import app from "./src/index.js";
import { join, dirname } from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

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
