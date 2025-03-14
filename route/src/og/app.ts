import { Hono } from "hono";
import { Bindings, cacheControl, fetchStatic } from "../env.js";
import { ImageResponse } from "@vercel/og";
import briefApp from "../api/brief.js";
import { HTTPException } from "hono/http-exception";
import {
  ChartBrief,
  deserializeResultParams,
  ResultParams,
} from "@falling-nikochan/chart";
import { OGShare } from "./ogShare.js";
import { OGResult } from "./ogResult.js";
import { env } from "hono/adapter";
import msgpack from "@ygoe/msgpack";
import packageJson from "../../package.json" with { type: "json" };

export interface ChartBriefMin {
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
}

const ogApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .get("/:type/:cid", async (c) => {
    const cid = c.req.param("cid");

    // /og/share/cid へのアクセスでは /og/share/cid?brief=表示する全情報&v=version へ301リダイレクトし、
    // /og/share/cid?brief=表示する全情報 で生成した画像を永久にキャッシュ
    // (vパラメータは /share でも追加されるけど)
    if (!c.req.query("brief")) {
      const briefRes = await briefApp.request(`/${cid}`);
      if (!briefRes.ok) {
        let message = "";
        try {
          message =
            ((await briefRes.json()) as { message?: string }).message || "";
        } catch {
          //
        }
        throw new HTTPException(briefRes.status as 401 | 404 | 500, {
          message,
        });
      }
      const brief = (await briefRes.json()) as ChartBrief;
      const sBrief = msgpack.serialize([
        brief.ytId,
        brief.title,
        brief.composer,
        brief.chartCreator,
      ]);
      let sBriefBin = "";
      for (let i = 0; i < sBrief.length; i++) {
        sBriefBin += String.fromCharCode(sBrief[i]);
      }
      // キャッシュが正しく動作するように、クエリパラメータの順番が常に一定である必要がある
      const ogQuery = new URLSearchParams();
      ogQuery.set("lang", c.req.query("lang") || "en");
      if (c.req.query("result")) ogQuery.set("result", c.req.query("result")!);
      ogQuery.set(
        "brief",
        btoa(sBriefBin)
          .replaceAll("+", "-")
          .replaceAll("/", "_")
          .replaceAll("=", ""),
      );
      ogQuery.set("v", packageJson.version);
      return c.redirect(`${c.req.path}?${ogQuery.toString()}`, 307);
    }

    const sBriefBin = atob(
      c.req.query("brief")!.replaceAll("-", "+").replaceAll("_", "/"),
    );
    let sBriefArr = new Uint8Array(sBriefBin.length);
    for (let i = 0; i < sBriefBin.length; i++) {
      sBriefArr[i] = sBriefBin.charCodeAt(i);
    }
    const briefArr = msgpack.deserialize(sBriefArr);
    const brief: ChartBriefMin = {
      ytId: briefArr[0],
      title: briefArr[1],
      composer: briefArr[2],
      chartCreator: briefArr[3],
    };

    const lang = c.req.query("lang") || "en"; // c.get("language");
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
        env(c),
        new URL(`/assets/${f.file}`, new URL(c.req.url).origin),
      ),
    }));
    let pBgImage: Promise<Response>;
    switch (c.req.param("type")) {
      case "share":
        // [locale]/ogTemplate/share をスクショしたpng画像を /assets に置く
        pBgImage = fetchStatic(
          env(c),
          new URL(`/assets/ogTemplateShare.png`, new URL(c.req.url).origin),
        );
        break;
      case "result":
        pBgImage = fetchStatic(
          env(c),
          new URL(`/assets/ogTemplateResult.png`, new URL(c.req.url).origin),
        );
        break;
      default:
        throw new HTTPException(404);
    }

    const bgImageBuf = new Uint8Array(await (await pBgImage).arrayBuffer());
    let bgImageBin = "";
    for (let i = 0; i < bgImageBuf.byteLength; i++) {
      bgImageBin += String.fromCharCode(bgImageBuf[i]);
    }

    let Image: Promise<React.ReactElement>;
    switch (c.req.param("type")) {
      case "share":
        Image = OGShare(cid, lang, brief, bgImageBin);
        break;
      case "result":
        if (!resultParams) {
          throw new HTTPException(400, { message: "missingResultParam" });
        }
        Image = OGResult(cid, lang, brief, bgImageBin, resultParams);
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
        })),
      ),
    });
    if (imRes.ok && imRes.body) {
      return c.body(imRes.body, 200, {
        "Content-Type": imRes.headers.get("Content-Type") || "",
        "Cache-Control": cacheControl(env(c), 315360000),
      });
    } else {
      console.error(imRes);
      throw new HTTPException(500, { message: "imageGenerationFailed" });
    }
  })
  .get("/:cid{[0-9]+}", (c) =>
    // deprecated (used until ver8.11)
    c.redirect(`/og/share/${c.req.param("cid")}`, 301),
  );

export default ogApp;
