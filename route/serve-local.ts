import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./src/index.js";
import { join, dirname } from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

const port = 8787;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.use(
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
  ).fetch,
  port,
});
