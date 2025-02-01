import { Hono } from "hono";
import apiApp from "./api/app";
import { Bindings } from "./env";
import briefApp from "./api/brief";
import { fetchStatic } from "./static";
import { ChartBrief, pageTitle } from "@/chartFormat/chart";

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .route("/api", apiApp)
  .get("/edit/:cid", (c) => {
    // deprecated (used until ver6.15)
    const cid = c.req.param("cid");
    return c.redirect(`/edit?cid=${cid}`, 301);
  })
  .on(
    "get",
    ["/share/:cid{[0-9]+}", "_next/static/chunks/app/share/:cid/:f"],
    async (c) => {
      const cid = c.req.param("cid");
      const pBrief = briefApp.request(`/${cid}`);
      const pRes = fetchStatic(
        c.req.path.replace(/share\/[0-9]+/, "share/placeholder")
      );
      const { message, brief } = (await (await pBrief).json()) as {
        message?: string;
        brief?: ChartBrief;
      };
      if (brief) {
        const res = await pRes;
        const replacedBody = (await res.text())
          .replaceAll("share/placeholder", `share/${cid}`)
          .replaceAll("PLACEHOLDER_TITLE", pageTitle(cid, brief))
          .replaceAll(
            '"PLACEHOLDER_BRIEF"',
            JSON.stringify(JSON.stringify(brief))
          );
        return c.text(replacedBody, 200, {
          "Content-Type": res.headers.get("Content-Type") || "text/plain",
          "Cache-Control": "max-age=600",
        });
      } else {
        console.error(message);
        return c.notFound();
      }
    }
  );

export default app;
