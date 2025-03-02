import React from "react";
import { getTranslations } from "@falling-nikochan/i18n";
import {
  baseScoreRate,
  bigScoreRate,
  ChartBrief,
  levelTypes,
  rankStr,
} from "@falling-nikochan/chart";
import {
  fontMainUi,
  fontTitle,
  flexCol,
  flexRow,
  slate800,
  text4xl,
  text5xl,
  levelColors,
  text2xl,
  text3xl,
  bold,
} from "./style.js";

interface ResultParams {
  lvIndex: number;
  baseScore: number;
  chainScore: number;
  bigScore: number;
  judgeCount: [number, number, number, number];
  bigCount: number;
}
export async function OGResult(
  cid: string,
  lang: string,
  brief: ChartBrief,
  bgImageBin: string,
  params: ResultParams
) {
  const t = await getTranslations(lang, "play.result");
  const ts = await getTranslations(lang, "play.status");
  return (
    <div
      style={{
        ...flexRow,
        alignItems: "flex-start",
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
          // flexGrow: 1,  does not work
          minWidth: 0,
          width: 1200 - (64 + 16 + 20) * 4,
          ...flexCol,
        }}
      >
        <div
          style={{
            paddingLeft: (124 + 16) * 4,
            marginTop: 16 * 4,
            ...text4xl,
            fontFamily: fontMainUi,
          }}
        >
          {cid}
        </div>
        <div
          style={{
            paddingLeft: 20 * 4,
            marginTop: 10 * 4,
            width: 2147483647,
            ...text5xl,
            fontFamily: fontTitle,
          }}
        >
          {brief.title}
        </div>
        <div
          style={{
            paddingLeft: 20 * 4,
            marginTop: 6 * 4,
            ...flexRow,
            width: 2147483647,
          }}
        >
          {brief.levels[params.lvIndex].name && (
            <span
              style={{ fontFamily: fontTitle, ...text4xl, marginRight: 4 * 4 }}
            >
              {brief.levels[params.lvIndex].name}
            </span>
          )}
          <span
            style={{
              fontFamily: fontMainUi,
              ...text4xl,
              color:
                levelColors[
                  levelTypes.indexOf(brief.levels[params.lvIndex].type)
                ],
            }}
          >
            {brief.levels[params.lvIndex].type}-
          </span>
          <span
            style={{
              fontFamily: fontMainUi,
              ...text5xl,
              color:
                levelColors[
                  levelTypes.indexOf(brief.levels[params.lvIndex].type)
                ],
            }}
          >
            {brief.levels[params.lvIndex].difficulty}
          </span>
        </div>
        <div
          style={{
            marginLeft: 20 * 4,
            marginTop: 8 * 4,
            padding: 6 * 4,
            ...flexCol,
            fontFamily: fontMainUi,
          }}
        >
          <div
            style={{
              ...flexRow,
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ flexGrow: 1, ...flexCol }}>
              <div style={{ ...flexRow, width: "100%" }}>
                <span style={{ flexGrow: 1, ...text2xl }}>
                  {t("baseScore")}
                </span>
                <span style={{ ...text5xl }}>
                  {Math.floor(params.baseScore)}
                </span>
                <span style={{ ...text3xl }}>.</span>
                <span style={{ ...text3xl, textAlign: "left", width: 10 * 4 }}>
                  {(Math.floor(params.baseScore * 100) % 100)
                    .toString()
                    .padStart(2, "0")}
                </span>
              </div>
              <div
                style={{
                  ...flexRow,
                  width: "100%",
                  height: 48,
                  marginTop: 2 * 4,
                }}
              >
                <span style={{ flexGrow: 1, ...text2xl }}>
                  {t("chainBonus")}
                </span>
                <span style={{ ...text5xl }}>
                  {Math.floor(params.chainScore)}
                </span>
                <span style={{ ...text3xl }}>.</span>
                <span style={{ ...text3xl, textAlign: "left", width: 10 * 4 }}>
                  {(Math.floor(params.chainScore * 100) % 100)
                    .toString()
                    .padStart(2, "0")}
                </span>
              </div>
              <div style={{ ...flexRow, width: "100%", marginTop: 2 * 4 }}>
                <span style={{ flexGrow: 1, ...text2xl }}>
                  {t("bigNoteBonus")}
                </span>
                <span style={{ ...text5xl }}>
                  {Math.floor(params.bigScore)}
                </span>
                <span style={{ ...text3xl }}>.</span>
                <span style={{ ...text3xl, textAlign: "left", width: 10 * 4 }}>
                  {(Math.floor(params.bigScore * 100) % 100)
                    .toString()
                    .padStart(2, "0")}
                </span>
              </div>
              <div style={{ marginTop: (2 + 2) * 4 }} />
              <div style={{ ...flexRow, width: "100%", marginTop: 2 * 4 }}>
                <span style={{ flexGrow: 1, ...text2xl }}>
                  {t("totalScore")}
                </span>
                <span style={{ ...text5xl }}>
                  {Math.floor(
                    params.baseScore + params.chainScore + params.bigScore
                  )}
                </span>
                <span style={{ ...text3xl }}>.</span>
                <span style={{ ...text3xl, textAlign: "left", width: 10 * 4 }}>
                  {(
                    Math.floor(
                      (params.baseScore + params.chainScore + params.bigScore) *
                        100
                    ) % 100
                  )
                    .toString()
                    .padStart(2, "0")}
                </span>
              </div>
            </div>
            <div
              style={{
                width: 72 * 4,
                ...flexCol,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ ...flexRow }}>
                <span style={{ marginRight: 2 * 4, ...text2xl }}>
                  {t("rank")}:
                </span>
                <span style={{ ...text5xl }}>
                  {rankStr(
                    params.baseScore + params.chainScore + params.bigScore
                  )}
                </span>
              </div>
              <div style={{ ...flexRow, marginTop: 4 * 4, ...text3xl }}>
                <span>
                  {params.baseScore === baseScoreRate
                    ? t("perfect")
                    : t("full")}
                </span>
                {params.bigScore === bigScoreRate && (
                  <span style={{ ...bold }}>+</span>
                )}
                <span>!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          width: 64 * 4,
          marginTop: 74 * 4,
          marginLeft: 16 * 4,
          marginRight: 20 * 4,
          ...flexCol,
        }}
      >
        {["good", "ok", "bad", "miss"].map((name, ji) => (
          <div key={ji} style={{ ...flexRow, marginBottom: 1.5 * 4 }}>
            <span style={{ ...text2xl, flexGrow: 1, marginLeft: 8 * 4 }}>
              {ts(name)}
            </span>
            <span style={{ ...text4xl }}>{params.judgeCount[ji]}</span>
          </div>
        ))}
        <div style={{ ...flexRow }}>
          <span style={{ ...text2xl, flexGrow: 1 }}>{ts("big")}</span>
          <span style={{ ...text4xl }}>{params.bigCount}</span>
        </div>
      </div>
    </div>
  );
}
