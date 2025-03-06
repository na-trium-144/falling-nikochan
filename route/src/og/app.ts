import { Hono } from "hono";
import { Bindings } from "../env.js";
import { ImageResponse } from "@vercel/og";
import briefApp from "../api/brief.js";
import { HTTPException } from "hono/http-exception";
import {
  ChartBrief,
  deserializeResultParams,
  ResultParams,
} from "@falling-nikochan/chart";
import { fetchStatic } from "../static.js";
import { OGShare } from "./ogShare.js";
import { OGResult } from "./ogResult.js";

const ogApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .get("/:type/:cid", async (c) => {
    const lang = c.req.query("lang") || "en"; // c.get("language");
    const cid = c.req.param("cid");
    const qResult = c.req.query("result");
    let resultParams: ResultParams | null = null;
    if (qResult) {
      try {
        resultParams = deserializeResultParams(qResult);
      } catch (e) {
        console.error(e);
        throw new HTTPException(400, { message: "invalidResultParam" });
      }
    }
    const pBriefRes = briefApp.request(`/${cid}`);
    const pFonts = (
      [
        {
          name: "merriweather",
          file: "merriweather-latin-400-normal.ttf",
          weight: 400,
          style: "normal",
        },
        {
          name: "kaisei-opti",
          file: "kaisei-opti-japanese-400-normal.ttf",
          weight: 400,
          style: "normal",
        },
        {
          name: "noto-sans",
          file: "noto-sans-latin-400-normal.ttf",
          weight: 400,
          style: "normal",
        },
        {
          name: "noto-sans-jp",
          file: "noto-sans-jp-japanese-400-normal.ttf",
          weight: 400,
          style: "normal",
        },
      ] as const
    ).map((f) => ({
      ...f,
      pData: fetchStatic(
        new URL(`/assets/${f.file}`, new URL(c.req.url).origin)
      ),
    }));
    let pBgImage: Promise<Response>;
    switch (c.req.param("type")) {
      case "share":
        // [locale]/ogTemplate/share をスクショしたpng画像を /assets に置く
        pBgImage = fetchStatic(
          new URL(`/assets/ogTemplateShare.png`, new URL(c.req.url).origin)
        );
        break;
      case "result":
        pBgImage = fetchStatic(
          new URL(`/assets/ogTemplateResult.png`, new URL(c.req.url).origin)
        );
        break;
      default:
        throw new HTTPException(404);
    }

    const briefRes = await pBriefRes;
    if (!briefRes.ok) {
      let message = "";
      try {
        message =
          ((await briefRes.json()) as { message?: string }).message || "";
      } catch {
        //
      }
      throw new HTTPException(briefRes.status as 401 | 404 | 500, { message });
    }
    const brief = (await briefRes.json()) as ChartBrief;
    const bgImageBuf = new Uint8Array(await (await pBgImage).arrayBuffer());
    let bgImageBin = "";
    for (let i = 0; i < bgImageBuf.byteLength; i++) {
      bgImageBin += String.fromCharCode(bgImageBuf[i]);
    }

    let Image: Promise<React.ReactElement>;
    let cacheControl: string;
    switch (c.req.param("type")) {
      case "share":
        Image = OGShare(cid, lang, brief, bgImageBin);
        cacheControl = "max-age=7200";
        break;
      case "result":
        if (!resultParams) {
          throw new HTTPException(400, { message: "missingResultParam" });
        }
        Image = OGResult(cid, lang, brief, bgImageBin, resultParams);
        cacheControl = "max-age=31536000";
        break;
    }
    const imRes = new ImageResponse(await Image!, {
      width: 1200,
      height: 630,
      fonts: await Promise.all(
        pFonts.map(async (f) => ({
          name: f.name,
          weight: f.weight,
          style: f.style,
          data: await (await f.pData).arrayBuffer(),
        }))
      ),
    });
    if (imRes.ok && imRes.body) {
      return c.body(imRes.body, 200, {
        "Content-Type": imRes.headers.get("Content-Type") || "",
        "Cache-Control": cacheControl!,
      });
    } else {
      console.error(imRes);
      throw new HTTPException(500, { message: "imageGenerationFailed" });
    }
  })
  .get("/:cid{[0-9]+}", (c) =>
    // deprecated (used until ver8.11)
    c.redirect(`/og/share/${c.req.param("cid")}`, 301)
  );

export default ogApp;
