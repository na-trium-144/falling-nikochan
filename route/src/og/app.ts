import { ExecutionContext, Hono } from "hono";
import { Bindings, cacheControl } from "../env.js";
// import { ImageResponse } from "@vercel/og";
import { HTTPException } from "hono/http-exception";
import {
  ChartBrief,
  deserializeResultParams,
  inputTypes,
  levelTypes,
  ResultParams,
} from "@falling-nikochan/chart";
import { OGShare } from "./ogShare.js";
import { OGResult } from "./ogResult.js";
import { env } from "hono/adapter";
import msgpack from "@ygoe/msgpack";
import packageJson from "../../package.json" with { type: "json" };
import { cors } from "hono/cors";
import ColorThief from "colorthief";
import { adjustColor } from "./style.js";

export interface ChartBriefMin {
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  lvType?: number; // 0, 1, 2
}

const ogApp = (config: {
  ImageResponse: any;
  fetchBrief: (
    e: Bindings,
    cid: string,
    ctx: ExecutionContext | undefined
  ) => Response | Promise<Response>;
  fetchStatic: (e: Bindings, url: URL) => Response | Promise<Response>;
}) =>
  new Hono<{ Bindings: Bindings }>({ strict: false })
    .use("/*", cors({ origin: "*" }))
    .get("/:type/:cid", async (c) => {
      const cid = c.req.param("cid");

      // /og/share/cid へのアクセスでは /og/share/cid?brief=表示する全情報&v=version へ301リダイレクトし、
      // /og/share/cid?brief=表示する全情報 で生成した画像を永久にキャッシュ
      // (vパラメータは /share でも追加されるけど)
      if (!c.req.query("brief")) {
        let executionCtx: ExecutionContext | undefined = undefined;
        try {
          executionCtx = c.executionCtx;
        } catch {
          //ignore
        }
        const briefRes = await config.fetchBrief(env(c), cid, executionCtx);
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
        const lvType = levelTypes.indexOf(
          brief.levels.filter((l) => !l.unlisted).at(0)?.type || ""
        );
        const sBrief = msgpack.serialize([
          brief.ytId,
          brief.title,
          brief.composer,
          brief.chartCreator,
          lvType >= 0 ? lvType : undefined,
        ]);
        let sBriefBin = "";
        for (let i = 0; i < sBrief.length; i++) {
          sBriefBin += String.fromCharCode(sBrief[i]);
        }
        // キャッシュが正しく動作するように、クエリパラメータの順番が常に一定である必要がある
        const ogQuery = new URLSearchParams();
        ogQuery.set("lang", c.req.query("lang") || "en");
        if (c.req.query("result"))
          ogQuery.set("result", c.req.query("result")!);
        ogQuery.set(
          "brief",
          btoa(sBriefBin)
            .replaceAll("+", "-")
            .replaceAll("/", "_")
            .replaceAll("=", "")
        );
        ogQuery.set("v", packageJson.version);
        return c.redirect(
          new URL(
            `${c.req.path}?${ogQuery.toString()}`,
            env(c).BACKEND_PREFIX || new URL(c.req.url).origin
          ),
          307
        );
      }

      const sBriefBin = atob(
        c.req.query("brief")!.replaceAll("-", "+").replaceAll("_", "/")
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
        lvType: briefArr[4],
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
        pData: config.fetchStatic(
          env(c),
          new URL(
            `/og-fonts/${f.file}`,
            env(c).BACKEND_PREFIX || new URL(c.req.url).origin
          )
        ),
      }));
      let imagePath: string;
      switch (c.req.param("type")) {
        case "share":
          // [locale]/ogTemplate/share をスクショしたpng画像を /assets に置く
          imagePath = "/assets/ogTemplateShare.png";
          break;
        case "result":
          imagePath = "/assets/ogTemplateResult.png";
          break;
        default:
          throw new HTTPException(404);
      }
      const pBgImageBin = new Promise<Response>((res) =>
        res(
          config.fetchStatic(
            env(c),
            new URL(
              imagePath,
              env(c).BACKEND_PREFIX || new URL(c.req.url).origin
            )
          )
        )
      )
        .then((bgImage) => bgImage.arrayBuffer())
        .then((buf) => {
          const bgImageBuf = new Uint8Array(buf);
          let bgImageBin = "";
          for (let i = 0; i < bgImageBuf.byteLength; i++) {
            bgImageBin += String.fromCharCode(bgImageBuf[i]);
          }
          return bgImageBin;
        });

      let pInputTypeImageBin: Promise<string> | null = null;
      if (resultParams) {
        let imagePath: string | null;
        switch (resultParams.inputType) {
          case inputTypes.keyboard:
            imagePath = "/og-icons/icon-slate500-keyboard-one.svg";
            break;
          case inputTypes.mouse:
            imagePath = "/og-icons/icon-slate500-mouse-one.svg";
            break;
          case inputTypes.touch:
            imagePath = "/og-icons/icon-slate500-click-tap.svg";
            break;
          case inputTypes.pen:
            imagePath = "/og-icons/icon-slate500-write.svg";
            break;
          case inputTypes.gamepad:
            imagePath = "/og-icons/icon-slate500-game-three.svg";
            break;
          case null:
            imagePath = null;
            break;
          default:
            console.error(`unknown touch type ${resultParams.inputType}`);
            imagePath = null;
            break;
        }
        if (imagePath) {
          pInputTypeImageBin = new Promise<Response>((res) =>
            res(
              config.fetchStatic(
                env(c),
                new URL(
                  imagePath,
                  env(c).BACKEND_PREFIX || new URL(c.req.url).origin
                )
              )
            )
          )
            .then((image) => image.arrayBuffer())
            .then((buf) => {
              const inputTypeImageBuf = new Uint8Array(buf);
              let inputTypeImageBin = "";
              for (let i = 0; i < inputTypeImageBuf.byteLength; i++) {
                inputTypeImageBin += String.fromCharCode(inputTypeImageBuf[i]);
              }
              return inputTypeImageBin;
            });
        }
      }

      const pColorThief = fetch(
        `https://i.ytimg.com/vi/${brief.ytId}/mqdefault.jpg`
      ).then(async (imgRes) => {
        const imgBuf = await imgRes.arrayBuffer();
        const color = await ColorThief.getColor(imgBuf, 1);
        const colorAdjusted = adjustColor(color);
        return `rgb(${colorAdjusted[0]}, ${colorAdjusted[1]}, ${colorAdjusted[2]})`;
      });

      let Image: Promise<React.ReactElement>;
      switch (c.req.param("type")) {
        case "share":
          Image = OGShare(cid, lang, brief, pBgImageBin, pColorThief);
          break;
        case "result":
          if (!resultParams) {
            throw new HTTPException(400, { message: "missingResultParam" });
          }
          Image = OGResult(
            cid,
            lang,
            brief,
            pBgImageBin,
            resultParams,
            pInputTypeImageBin,
            pColorThief
          );
          break;
      }
      const imRes = new config.ImageResponse(await Image!, {
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
      }) as Response;
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
      c.redirect(
        new URL(
          `/og/share/${c.req.param("cid")}`,
          env(c).BACKEND_PREFIX || new URL(c.req.url).origin
        ),
        301
      )
    );

export default ogApp;
