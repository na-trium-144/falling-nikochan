import React from "react";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import {
  flexCol,
  flexRow,
  fontMainUi,
  fontTitle,
  slate800,
  text4xl,
  text5xl,
  text7xl,
} from "./style.js";
import { ChartBriefMin } from "./app.js";

export async function OGShare(
  cid: string,
  lang: string,
  brief: ChartBriefMin,
  bgImageBin: string,
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
        src={`data:image/png;base64,${btoa(bgImageBin)}`}
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
          marginTop: 50 * 4,
          ...text5xl,
          fontFamily: fontMainUi,
        }}
      >
        {cid}
      </div>
      <div
        style={{
          paddingLeft: 20 * 4,
          marginTop: 12 * 4,
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
          ...flexRow,
          paddingLeft: 20 * 4,
          marginTop: 4 * 4,
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
    </div>
  );
}
