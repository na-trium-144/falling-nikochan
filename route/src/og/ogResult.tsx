import React from "react";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import {
  baseScoreRate,
  bigScoreRate,
  chainScoreRate,
  levelTypes,
  rankStr,
  ResultParams,
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
  slate500,
  amber500,
  slate400,
  emerald500,
  rose400,
} from "./style.js";
import { ChartBriefMin } from "./app.js";

export async function OGResult(
  cid: string,
  lang: string,
  brief: ChartBriefMin,
  bgImageBin: Promise<string>,
  params: ResultParams,
  inputTypeImageBin: Promise<string> | null
) {
  const th = await getTranslations(lang, "share");
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
        src={`data:image/png;base64,${btoa(await bgImageBin)}`}
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
            marginTop: 12 * 4,
            ...text4xl,
            fontFamily: fontMainUi,
          }}
        >
          {cid}
        </div>
        <div
          style={{
            paddingLeft: 20 * 4,
            marginTop: 6 * 4,
            width: 2147483647,
            ...flexRow,
          }}
        >
          <span
            style={{
              ...text5xl,
              fontFamily: fontTitle,
            }}
          >
            {brief.title}
          </span>
          {brief.composer && (
            <>
              <span
                style={{ ...text4xl, fontFamily: fontTitle, marginLeft: 4 * 4 }}
              >
                /
              </span>
              <span
                style={{ ...text4xl, fontFamily: fontTitle, marginLeft: 4 * 4 }}
              >
                {brief.composer}
              </span>
            </>
          )}
        </div>
        <div
          style={{
            ...flexRow,
            paddingLeft: 20 * 4,
            marginTop: 4 * 4,
            width: 2147483647,
            ...text4xl,
            fontFamily: fontTitle,
          }}
        >
          <span
            style={{
              ...text3xl,
              marginRight: 4 * 4,
              fontFamily: fontMainUi,
            }}
          >
            {th("chartCreator")}:
          </span>
          <span>{brief.chartCreator}</span>
        </div>
        <div
          style={{
            paddingLeft: 20 * 4,
            marginTop: 2 * 4,
            ...flexRow,
            width: 2147483647,
          }}
        >
          {params.lvName && (
            <span
              style={{ fontFamily: fontTitle, ...text4xl, marginRight: 4 * 4 }}
            >
              {params.lvName}
            </span>
          )}
          <span
            style={{
              fontFamily: fontMainUi,
              ...text4xl,
              color: levelColors[params.lvType],
            }}
          >
            {levelTypes[params.lvType]}-
          </span>
          <span
            style={{
              fontFamily: fontMainUi,
              ...text5xl,
              color: levelColors[params.lvType],
            }}
          >
            {params.lvDifficulty}
          </span>
        </div>
        <div
          style={{
            marginLeft: 20 * 4,
            marginTop: 6 * 4,
            padding: 6 * 4,
            ...flexCol,
            position: "relative",
            fontFamily: fontMainUi,
          }}
        >
          {params.date && (
            <div
              style={{
                position: "absolute",
                bottom: 6 * 4,
                right: 6 * 4,
                ...text3xl,
                color: slate500,
                ...flexRow,
              }}
            >
              <span>(</span>
              <span>{params.date.toLocaleDateString(lang)}</span>
              {inputTypeImageBin && (
                <img
                  style={{
                    marginLeft: 12,
                    height: 30,
                  }}
                  src={`data:image/svg+xml;base64,${btoa(await inputTypeImageBin)}`}
                />
              )}
              <span>)</span>
            </div>
          )}
          <div
            style={{
              ...flexRow,
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ flexGrow: 1, ...flexCol }}>
              {(
                [
                  ["baseScore", params.baseScore100],
                  ["chainBonus", params.chainScore100],
                  ["bigNoteBonus", params.bigScore100],
                ] as const
              ).map(([name, score], i) => (
                <div
                  key={i}
                  style={{
                    ...flexRow,
                    width: "100%",
                    marginBottom: 2 * 4,
                    color:
                      name === "bigNoteBonus" && params.bigCount === null
                        ? slate400
                        : undefined,
                  }}
                >
                  <span style={{ flexGrow: 1, ...text2xl }}>{t(name)}:</span>
                  <span style={{ ...text5xl }}>{Math.floor(score / 100)}</span>
                  <span style={{ ...text3xl }}>.</span>
                  <span
                    style={{ ...text3xl, textAlign: "left", width: 10 * 4 }}
                  >
                    {(score % 100).toString().padStart(2, "0")}
                  </span>
                </div>
              ))}
              <div style={{ marginBottom: (2 + 2) * 4 }} />
              <div
                style={{ ...flexRow, width: "100%" /*, marginBottom: 2 * 4*/ }}
              >
                <span style={{ flexGrow: 1, ...text2xl }}>
                  {t("totalScore")}:
                </span>
                <span style={{ ...text5xl }}>
                  {Math.floor(params.score100 / 100)}
                </span>
                <span style={{ ...text3xl }}>.</span>
                <span style={{ ...text3xl, textAlign: "left", width: 10 * 4 }}>
                  {(params.score100 % 100).toString().padStart(2, "0")}
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
                <span style={{ ...text3xl }}>(</span>
                <span style={{ marginRight: 2 * 4, ...text2xl }}>
                  {t("playbackRate")}:
                </span>
                <span style={{ ...text3xl }}>×{params.playbackRate4 / 4})</span>
              </div>
              <div style={{ ...flexRow }}>
                <span style={{ marginRight: 2 * 4, ...text2xl }}>
                  {t("rank")}:
                </span>
                <span style={{ ...text5xl }}>
                  {rankStr(params.score100 / 100)}
                </span>
              </div>
              {params.chainScore100 === chainScoreRate * 100 ? (
                <div style={{ ...flexRow, marginTop: 4 * 4, ...text3xl }}>
                  <span>
                    {params.baseScore100 === baseScoreRate * 100
                      ? t("perfect")
                      : t("full")}
                  </span>
                  {params.bigScore100 === bigScoreRate * 100 && (
                    <span style={{ ...bold }}>+</span>
                  )}
                  <span>!</span>
                </div>
              ) : null}
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
        {params.bigCount !== false && (
          <div
            style={{
              ...flexRow,
              color: params.bigCount === null ? slate400 : undefined,
            }}
          >
            <span style={{ ...text2xl, flexGrow: 1 }}>{ts("big")}</span>
            <span style={{ ...text4xl }}>{params.bigCount || 0}</span>
          </div>
        )}
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
          backgroundColor: [emerald500, amber500, rose400][params.lvType],
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
