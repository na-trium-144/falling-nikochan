import React from "react";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import {
  flexCol,
  flexRow,
  fontMainUi,
  fontTitle,
  levelColors,
  slate800,
  text4xl,
  text5xl,
  text7xl,
} from "./style.js";
import { ChartBriefMin } from "./app.js";
import { levelTypes } from "@falling-nikochan/chart";

// heightはogTemplateのほうの実測。
// ただしogTemplateを表示する際のページの拡大率によって正確なpx数が変わりうるので注意
// (macOSのchromeにて100%でスクリーンショットを撮り100%での実測値を書いている)

export async function OGShare(
  cid: string,
  lang: string,
  brief: ChartBriefMin,
  bgImageBin: Promise<string>,
  color: Promise<string>
) {
  const t = await getTranslations(lang, "share");
  return (
    <div
      style={{
        ...flexCol,
        position: "absolute",
        width: "100%",
        height: "100%",
        color: slate800,
      }}
    >
      <img
        style={{
          width: "100%",
          position: "absolute",
        }}
        src={`data:image/png;base64,${btoa(await bgImageBin)}`}
      />
      <div
        style={{
          paddingLeft: (20 + 24) * 4,
          marginTop: 36 * 4,
          ...text5xl,
          height: 48,
          fontFamily: fontMainUi,
        }}
      >
        {cid}
      </div>
      <div
        style={{
          ...flexRow,
          paddingLeft: 20 * 4,
          marginTop: 6 * 4,
          width: 2147483647,
          ...text5xl,
          height: 50,
          fontFamily: fontTitle,
        }}
      >
        <span
          style={{
            ...text4xl,
            marginRight: 5 * 4,
            fontFamily: fontMainUi,
          }}
        >
          {t("chartCreator")}:
        </span>
        <span>{brief.chartCreator}</span>
      </div>
      <div
        style={{
          paddingLeft: 20 * 4,
          marginTop: 10 * 4,
          width: 2147483647,
          // 困ったことにellipsisが効かない
          // width: "100%",
          // textWrap: "nowrap",
          // textOverflow: "ellipsis",
          // overflowX: "clip",
          // overflowY: "visible",
          ...text7xl,
          height: 72,
          fontFamily: fontTitle,
        }}
      >
        {brief.title}
      </div>
      <div
        style={{
          paddingLeft: 20 * 4,
          marginTop: 4 * 4,
          width: 2147483647,
          ...text5xl,
          height: 48,
          fontFamily: fontTitle,
        }}
      >
        {brief.composer}
      </div>
      <div
        style={{
          paddingLeft: 56 * 4,
          marginTop: 6 * 4,
          ...flexRow,
          height: 57.6,
          width: 2147483647,
        }}
      >
        {...brief.levels
          .map((l, i) => [
            // <> </> だとなぜか高さがおかしくなる
            i >= 1 && (
              <span
                style={{
                  marginLeft: 3 * 4,
                  marginRight: 3 * 4,
                  ...text4xl,
                  fontFamily: fontTitle,
                }}
              >
                /
              </span>
            ),
            !!l.name && (
              <span
                style={{
                  fontFamily: fontTitle,
                  ...text5xl,
                  marginRight: 4 * 4,
                }}
              >
                {l.name}
              </span>
            ),
            <span
              style={{
                fontFamily: fontMainUi,
                fontSize: text5xl.fontSize * 0.9,
                lineHeight: 1,
                color: levelColors[l.type],
              }}
            >
              {levelTypes[l.type]}-
            </span>,
            <span
              style={{
                fontFamily: fontMainUi,
                fontSize: text5xl.fontSize * 1.2,
                lineHeight: 1,
                // https://github.com/vercel/satori/issues/691
                // align-items: baseline で揃わないので微調整する
                transform: "translateY(3px)",
                color: levelColors[l.type],
              }}
            >
              {l.difficulty}
            </span>,
          ])
          .flat()}
      </div>
      {/* zIndexが効かなさそうなので代わりに順番を変えて解決 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: (120 + 4) * 4,
          height: ((120 * 9) / 16 + 4) * 4,
          borderBottomLeftRadius: 12,
          backgroundColor: await color,
        }}
      />
      <img
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 120 * 4,
          objectFit: "cover",
        }}
        src={
          // defaultやhqやsdは4:3で、mqだけなぜか16:9
          `https://i.ytimg.com/vi/${brief.ytId}/mqdefault.jpg`
        }
      />
    </div>
  );
}
