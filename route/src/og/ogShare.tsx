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
      <div
        style={{
          paddingLeft: (20 + 24) * 4,
          marginTop: 36 * 4,
          ...text5xl,
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
          fontFamily: fontTitle,
        }}
      >
        {brief.composer}
      </div>
      <div
        style={{
          paddingLeft: 50 * 4,
          marginTop: 6 * 4,
          ...flexRow,
          width: 2147483647,
        }}
      >
        {brief.levels.map((l, i) => (
          // <> </> だとなぜか高さがおかしくなる
          <div
            style={{
              ...flexRow,
              ...text5xl,
            }}
          >
            {i >= 1 && (
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
            )}
            {l.name && (
              <span
                style={{
                  fontFamily: fontTitle,
                  ...text5xl,
                  marginRight: 4 * 4,
                }}
              >
                {l.name}
              </span>
            )}
            <span
              style={{
                fontFamily: fontMainUi,
                fontSize: "0.9em",
                lineHeight: text5xl.lineHeight,
                color: levelColors[l.type],
              }}
            >
              {levelTypes[l.type]}-
            </span>
            <span
              style={{
                fontFamily: fontMainUi,
                fontSize: "1.2em",
                lineHeight: text5xl.lineHeight / 1.2, // なぜかわからないけどこれで揃う
                color: levelColors[l.type],
              }}
            >
              {l.difficulty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
