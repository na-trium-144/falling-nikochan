import { Hono } from "hono";
import { Bindings } from "./env.js";
import { ImageResponse } from "@vercel/og";
import briefApp from "./api/brief.js";
import { getTranslations } from "../i18n/i18n.js";

const ogApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  async (c) => {
    const lang = c.get("language");
    const cid = c.req.param("cid");
    const pBriefRes = briefApp.request(`/${cid}`);
    const t = await getTranslations(lang, "share");
    return c.body(
      new ImageResponse(
        (
          <div
            style={{
              fontSize: 128,
              // sky-50 to sky-200
              backgroundImage: "linear-gradient(to top in oklab, oklch(.977 .013 236.62) 0, oklch(.901 .058 230.902) 100%)",
              width: "100%",
              height: "100%",
              color: "oklch(.279 .041 260.031)", // text-slate-800
            }}
          >
            Hello world!
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      ).body!
    );
  }
);

export default ogApp;
