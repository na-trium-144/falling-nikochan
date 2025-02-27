import React from "react";
import { Hono } from "hono";
import { Bindings } from "./env.js";
import { ImageResponse } from "@vercel/og";
import briefApp from "./api/brief.js";
import { getTranslations } from "@falling-nikochan/i18n";
import { HTTPException } from "hono/http-exception";
import { ChartBrief } from "@falling-nikochan/chart";
import { fetchStatic } from "./static.js";

const ogApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  async (c) => {
    const lang = c.get("language");
    const cid = c.req.param("cid");
    const pBriefRes = briefApp.request(`/${cid}`);
    const t = await getTranslations(lang, "share");
    const fontMainUi = "merriweather, kaisei-opti";
    const fontTitle = "noto-sans, noto-sans-jp";
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

    const briefRes = await pBriefRes;
    if (briefRes.ok) {
      const brief = (await briefRes.json()) as ChartBrief;
      const imRes = new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              width: "100%",
              height: "100%",
              color: "rgb(29 41 61)", // text-slate-800
            }}
          >
            <img
              style={{
                width: "100%",
                position: "absolute",
              }}
              src={new URL(
                `/assets/ogTemplateShare.png`,
                new URL(c.req.url).origin
              ).toString()}
            />
            <img
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 1200 / 3 + 1,
                objectFit: "cover",
              }}
              src={
                // defaultやhqやsdは4:3で、mqだけなぜか16:9
                `https://i.ytimg.com/vi/${brief.ytId}/mqdefault.jpg`
              }
            />
            <div
              style={{
                paddingLeft: 32 + 96,
                marginTop: 160,
                // 5xl
                fontSize: 48,
                lineHeight: 1,
                fontFamily: fontMainUi,
              }}
            >
              {cid}
            </div>
            <div
              style={{
                paddingLeft: 32,
                marginTop: 32,
                width: 2147483647,
                // 困ったことにellipsisが効かない
                // width: "100%",
                // textWrap: "nowrap",
                // textOverflow: "ellipsis",
                // overflowX: "clip",
                // overflowY: "visible",
                // 7xl
                fontSize: 72,
                lineHeight: 1,
                fontFamily: fontTitle,
              }}
            >
              {brief.title}
            </div>
            <div
              style={{
                paddingLeft: 32,
                marginTop: 24,
                width: 2147483647,
                // 6xl
                fontSize: 60,
                lineHeight: 1,
                fontFamily: fontTitle,
              }}
            >
              {brief.composer}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                paddingLeft: 32,
                marginTop: 24,
                width: 2147483647,
                // 6xl
                fontSize: 60,
                lineHeight: 1,
                fontFamily: fontTitle,
              }}
            >
              <span
                style={{
                  // 5xl
                  fontSize: 48,
                  lineHeight: 1,
                  marginRight: 20,
                  fontFamily: fontMainUi,
                }}
              >
                {t("chartCreator")}:
              </span>
              <span>{brief.chartCreator}</span>
            </div>
          </div>
        ),
        {
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
        }
      );
      if (imRes.ok && imRes.body) {
        return c.body(imRes.body, 200, {
          "Content-Type": imRes.headers.get("Content-Type") || "",
          "Cache-Control": "no-store",
        });
      } else {
        console.error(imRes);
        throw new HTTPException(500, {
          message: "Failed to generate image",
        });
      }
    } else {
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
  }
);

export default ogApp;
