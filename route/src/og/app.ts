import { Hono } from "hono";
import {
  backendOrigin,
  Bindings,
  cacheControl,
  immutable,
  ResponseOK,
} from "../env.js";
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
import * as msgpack from "@msgpack/msgpack";
import packageJson from "../../package.json" with { type: "json" };
import { cors } from "hono/cors";
import { getColor } from "colorthief";
import { adjustColor } from "./style.js";
import * as v from "valibot";
import { fetchError } from "../error.js";
import { cache } from "hono/cache";
import { BaseLogger } from "@hono/structured-logger";

const REDIRECT_CACHE_MAX_AGE = 86400;

export interface ChartBriefMin {
  ytId: string;
  title: string;
  composer: string;
  chartCreator: string;
  levels: {
    name: string;
    type: number; // 0, 1, 2
    difficulty: number;
  }[];
}

const ChartBriefMinArraySchema = v.tuple([
  v.string(), // ytId
  v.string(), // title
  v.string(), // composer
  v.string(), // chartCreator,
  v.array(
    v.tuple([
      v.string(),
      v.picklist([0, 1, 2]), // lvType
      v.number(),
    ])
  ),
]);

const ogApp = (config: {
  ImageResponse: any;
  fetchBrief: (e: Bindings, cid: string) => Promise<{ brief: ChartBrief }>;
  fetchStatic: (e: Bindings, url: URL) => Promise<ResponseOK>;
}) =>
  new Hono<{ Bindings: Bindings; Variables: { logger: BaseLogger } }>({
    strict: false,
  })
    .use("/*", cors({ origin: "*" }))
    .use(
      "/*",
      cache({
        cacheName: "og",
      })
    )
    .get("/:type/:cid", async (c) => {
      const cid = c.req.param("cid");

      const vMajor = Number(c.req.query("v")?.split(".")[0]);
      const vMinor = Number(c.req.query("v")?.split(".")[1]);

      // /og/share/cid へのアクセスでは /og/share/cid?brief=表示する全情報&v=version へ301リダイレクトし、
      // /og/share/cid?brief=表示する全情報 で生成した画像を永久にキャッシュ
      // (vパラメータは /share でも追加されるけど)
      // ver16.30でbriefの仕様を変更したのでそれ以前は無視 (レベルの情報を追加)
      if (
        !c.req.query("brief") ||
        !c.req.query("v") ||
        vMajor < 16 ||
        (vMajor === 16 && vMinor <= 29)
      ) {
        const { brief } = await config.fetchBrief(env(c), cid);
        const sBrief = msgpack.encode([
          brief.ytId,
          brief.title,
          brief.composer,
          brief.chartCreator,
          brief.levels
            .filter((l) => !l.unlisted)
            .map((l) => [
              l.name,
              levelTypes.indexOf(l.type) as 0 | 1 | 2,
              l.difficulty,
            ]),
        ] satisfies v.InferOutput<typeof ChartBriefMinArraySchema>);
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
        c.header("cache-control", cacheControl(env(c), REDIRECT_CACHE_MAX_AGE));
        return c.redirect(
          new URL(`${c.req.path}?${ogQuery.toString()}`, backendOrigin(c)),
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
      const briefArr = v.parse(
        ChartBriefMinArraySchema,
        msgpack.decode(sBriefArr)
      );
      const brief: ChartBriefMin = {
        ytId: briefArr[0],
        title: briefArr[1],
        composer: briefArr[2],
        chartCreator: briefArr[3],
        levels: briefArr[4].map(([name, type, difficulty]) => ({
          name,
          type,
          difficulty,
        })),
      };

      const lang = c.req.query("lang") || "en"; // c.get("language");
      const qResult = c.req.query("result");
      let resultParams: ResultParams | null = null;
      if (qResult) {
        try {
          resultParams = deserializeResultParams(qResult);
        } catch (e) {
          c.var.logger.error(e);
          throw new HTTPException(400, { message: "invalidResultParam" });
        }
      }

      // font-title(NotoSans)でレンダリングする対象となるテキスト
      const renderedText = [
        brief.chartCreator,
        brief.title,
        brief.composer,
        "/",
        brief.levels.map((l) => l.name),
        resultParams?.lvName ?? "",
      ]
        .flat()
        .join("");

      // UIのフォントは見た目を固定することが重要なのでバージョン固定したfontsourceのフォントを静的に保持
      // (過去にMerriweatherが予告なく別物に置き換わった事例があるため)
      // 一方タイトルなどに使うNotoSansに関してはわりとどうでもいいので最新版のサブセットをfetch
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
        ] as const
      ).map(async (f) => ({
        ...f,
        data: await (
          await config.fetchStatic(
            env(c),
            new URL(`/og-fonts/${f.file}`, backendOrigin(c))
          )
        ).arrayBuffer(),
      }));
      const pGoogleFonts = (
        [
          {
            name: "noto-sans",
            data: loadGoogleFont("Noto Sans", renderedText),
            weight: 400,
            style: "normal",
          },
          {
            name: "noto-sans-jp",
            data: loadGoogleFont("Noto Sans JP", renderedText),
            weight: 400,
            style: "normal",
          },
        ] as const
      ).map(async (f) => ({ ...f, data: await f.data }));

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
      const pBgImageBin = config
        .fetchStatic(env(c), new URL(imagePath, backendOrigin(c)))
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
            imagePath = "/og-icons/keyboard-one.svg";
            break;
          case inputTypes.mouse:
            imagePath = "/og-icons/mouse-one.svg";
            break;
          case inputTypes.touch:
            imagePath = "/og-icons/click-tap.svg";
            break;
          case inputTypes.pen:
            imagePath = "/og-icons/write.svg";
            break;
          case inputTypes.gamepad:
            imagePath = "/og-icons/game-three.svg";
            break;
          case null:
            imagePath = null;
            break;
          default:
            c.var.logger.error(`unknown touch type ${resultParams.inputType}`);
            imagePath = null;
            break;
        }
        if (imagePath) {
          pInputTypeImageBin = config
            .fetchStatic(env(c), new URL(imagePath, backendOrigin(c)))
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
      )
        .catch(fetchError(env(c)))
        .then(async (imgRes) => {
          const imgBuf = await imgRes.arrayBuffer();
          const colorResult = await getColor(Buffer.from(imgBuf), {
            quality: 1,
          });
          const colorAdjusted = adjustColor(
            colorResult ? colorResult.array() : [128, 128, 128]
          );
          return `rgb(${colorAdjusted[0]}, ${colorAdjusted[1]}, ${colorAdjusted[2]})`;
        });

      let Image: React.ReactElement;
      switch (c.req.param("type")) {
        case "share":
          Image = await OGShare(cid, lang, brief, pBgImageBin, pColorThief);
          break;
        case "result":
          if (!resultParams) {
            throw new HTTPException(400, { message: "missingResultParam" });
          }
          Image = await OGResult(
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
      const imRes = new config.ImageResponse(Image!, {
        width: 1200,
        height: 630,
        fonts: [
          ...(await Promise.all(pFonts)),
          ...(await Promise.all(pGoogleFonts)),
        ],
      }) as Response;
      return c.body(imRes.body!, imRes.status as 200, {
        "Content-Type": imRes.headers.get("Content-Type") || "",
        "Cache-Control": immutable(),
      });
    })
    .get("/:cid{[0-9]+}", (c) => {
      // deprecated (used until ver8.11)
      c.header("cache-control", immutable());
      return c.redirect(
        new URL(`/og/share/${c.req.param("cid")}`, backendOrigin(c)),
        301
      );
    });

async function loadGoogleFont(
  fontFamily: string,
  text: string
): Promise<ArrayBuffer> {
  // User-Agentを指定せずにリクエストするとwoff2ではなく単一のttfで返ってくる
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    fontFamily
  )}:wght@400&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  );
  if (resource) {
    return await (await fetch(resource[1])).arrayBuffer();
  }
  const e = new Error("failed to fetch font data") as Error &
    Record<string, unknown>;
  // もしエラーが起きた場合にSentryに送るコンテキストデータ
  e.url = url;
  e.fontFamily = fontFamily;
  e.css = css;
  e.resource = resource;
  throw e;
}

export default ogApp;
