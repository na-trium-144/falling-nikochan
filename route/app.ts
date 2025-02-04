import { Hono } from "hono";
import apiApp from "./api/app.js";
import { Bindings } from "./env.js";
import briefApp from "./api/brief.js";
import { ChartBrief, pageTitle } from "../chartFormat/chart.js";
import { fetchStatic } from "./static.js";

async function errorResponse(origin: string, status: number, message: string) {
  return (
    await (await fetchStatic(new URL("/errorPlaceholder", origin))).text()
  )
    .replaceAll("PLACEHOLDER_STATUS", String(status))
    .replaceAll("PLACEHOLDER_MESSAGE", message)
    .replaceAll("PLACEHOLDER_TITLE", status == 404 ? "Not Found" : "Error");
  // _next/static/chunks/errorPlaceholder のほうには置き換え処理するべきものはなさそう
}

const app = new Hono<{ Bindings: Bindings }>({ strict: false })
  .notFound(async (c) =>
    c.body(
      (await fetchStatic(new URL("/404", new URL(c.req.url).origin))).body!,
      404,
      { "Content-Type": "text/html" }
    )
  )
  .onError(async (err, c) => {
    console.error(err);
    if (c.req.path.startsWith("/api")) {
      return c.json({ message: "Server Error" }, 500);
    } else {
      return c.body(
        await errorResponse(new URL(c.req.url).origin, 500, "Server Error"),
        500,
        { "Content-Type": "text/html" }
      );
    }
  })
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
      const pRes = fetchStatic(
        new URL(c.req.url.replace(/share\/[0-9]+/, "share/placeholder"))
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
        if (c.req.routePath === "/share/:cid{[0-9]+}") {
          let message = "";
          try {
            message =
              ((await briefRes.json()) as { message?: string }).message || "";
          } catch {
            //
          }
          return c.body(
            await errorResponse(
              new URL(c.req.url).origin,
              briefRes.status,
              message
            ),
            briefRes.status as 401 | 404 | 500,
            { "Content-Type": "text/html" }
          );
          // _next/static/chunks/errorPlaceholder のほうには置き換え処理するべきものはなさそう
        } else {
          return c.notFound();
        }
      }
    }
  );

export default app;
