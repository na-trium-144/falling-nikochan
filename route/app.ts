import { Hono } from "hono";
import apiApp from "./api/app.js";
import { Bindings } from "./env.js";
import briefApp from "./api/brief.js";
import { ChartBrief, pageTitle } from "../chartFormat/chart.js";

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .route("/api", apiApp)
  .get("/edit/:cid", (c) => {
    // deprecated (used until ver6.15)
    const cid = c.req.param("cid");
    return c.redirect(`/edit?cid=${cid}`, 301);
  })
  .on(
    "get",
    [
      "/share/:cid{[0-9]+}",
      "/share/:cid_txt{[0-9]+\\.txt}",
      "_next/static/chunks/app/share/:cid{[0-9]+}/:f",
    ],
    async (c) => {
      const cid = c.req.param("cid") || c.req.param("cid_txt").slice(0, -4);
      const pBriefRes = briefApp.request(`/${cid}`);
      const pRes = fetch(
        c.req.url.replace(/share\/[0-9]+/, "share/placeholder"),
        {
          headers: {
            // https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
            // same as VERCEL_AUTOMATION_BYPASS_SECRET but manually set for preview env only
            "x-vercel-protection-bypass":
              process.env.VERCEL_AUTOMATION_BYPASS_SECRET_PREVIEW_ONLY || "",
          },
        }
      );
      const briefRes = await pBriefRes;
      if (briefRes.ok) {
        const brief = (await briefRes.json()) as ChartBrief;
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
        try {
          const { message } = (await briefRes.json()) as { message?: string };
          console.error(message);
        } catch {
          //
        }
        return c.notFound();
      }
    }
  );

export default app;
