"use client";

import { ChartBrief, levelTypes, rankStr } from "@falling-nikochan/chart";
import {
  clearBestScore,
  getBestScore,
  ResultData,
} from "@/common/bestScore.js";
import Button from "@/common/button.js";
import { FourthNote } from "@/common/fourthNote.js";
import { levelColors } from "@/common/levelColors";
import { initSession } from "@/play/session.js";
import { JudgeIcon } from "@/play/statusBox.js";
import { RightOne, SmilingFace, Timer } from "@icon-park/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Props {
  cid: string;
  brief: ChartBrief;
}
export function PlayOption(props: Props) {
  const t = useTranslations("share");

  // levelが存在しない時 -1
  const [selectedLevel, setSelectedLevel] = useState<number>(
    props.brief.levels.findIndex((l) => !l.unlisted)
  );

  const [bestScoreState, setBestScoreState] = useState<ResultData>();
  const totalScore = bestScoreState
    ? bestScoreState.baseScore +
      bestScoreState.chainScore +
      bestScoreState.bigScore
    : 0;

  useEffect(() => {
    if (selectedLevel >= 0) {
      const data = getBestScore(props.cid, selectedLevel);
      if (data && data.levelHash === props.brief.levels[selectedLevel].hash) {
        setBestScoreState(data);
      } else {
        setBestScoreState(undefined);
        clearBestScore(props.cid, selectedLevel);
      }
    }
  }, [props, selectedLevel]);

  return (
    <>
      <p>{t("selectLevel")}:</p>
      <ul className="ml-2 mt-1 mb-2">
        {props.brief.levels.map(
          (level, i) =>
            level.unlisted || (
              <li key={i}>
                <button
                  className={
                    i === selectedLevel
                      ? "text-blue-600 dark:text-blue-400 "
                      : "hover:text-slate-500 hover:dark:text-stone-400 "
                  }
                  onClick={() => setSelectedLevel(i)}
                >
                  <span className="inline-block w-5 translate-y-0.5">
                    {i === selectedLevel && <RightOne theme="filled" />}
                  </span>
                  {level.name && (
                    <span className="inline-block mr-2 font-title">
                      {level.name}
                    </span>
                  )}
                  <span
                    className={
                      "inline-block mr-2 " +
                      (i === selectedLevel
                        ? levelColors[levelTypes.indexOf(level.type)]
                        : "")
                    }
                  >
                    <span className="text-sm">{level.type}-</span>
                    <span className="text-lg">{level.difficulty}</span>
                  </span>
                </button>
              </li>
            )
        )}
      </ul>
      {selectedLevel >= 0 ? (
        <>
          <div className="flex flex-col main-wide:flex-row items-baseline">
            <div>
              <span className="text-lg mx-1.5 ">
                <FourthNote />
              </span>
              <span className="mr-1">=</span>
              <span className="text-lg">
                {props.brief.levels[selectedLevel]?.bpmMin}
              </span>
              {props.brief.levels[selectedLevel]?.bpmMin !==
                props.brief.levels[selectedLevel]?.bpmMax && (
                <>
                  <span className="ml-1 mr-1">〜</span>
                  <span className="text-lg">
                    {props.brief.levels[selectedLevel]?.bpmMax}
                  </span>
                </>
              )}
            </div>
            <span className="mx-3 hidden main-wide:block">/</span>
            <div>
              <span className="inline-block w-5 translate-y-0.5">
                <Timer />
              </span>
              <span className="text-lg">
                {Math.floor(
                  Math.round(props.brief.levels[selectedLevel]?.length) / 60
                )}
              </span>
              <span className="text-lg">:</span>
              <span className="text-lg">
                {(Math.round(props.brief.levels[selectedLevel]?.length) % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
            <span className="mx-3 hidden main-wide:block">/</span>
            <div>
              <span className="inline-block w-5 translate-y-0.5">
                <SmilingFace />
              </span>
              <span className="mr-1">✕</span>
              <span className="text-lg">
                {props.brief.levels[selectedLevel]?.noteCount}
              </span>
            </div>
          </div>
          <p
            className={
              "-mx-2 px-2 group rounded-lg " +
              (bestScoreState
                ? "hover:bg-amber-50 hover:dark:bg-amber-950 "
                : "text-slate-400 dark:text-stone-600 ")
            }
          >
            <span>{t("bestScore")}:</span>
            <span className="inline-block text-2xl w-12 text-right">
              {Math.floor(totalScore)}
            </span>
            <span className="">.</span>
            <span className="inline-block w-6">
              {(Math.floor(totalScore * 100) % 100).toString().padStart(2, "0")}
            </span>
            {bestScoreState && (
              <>
                <span className="text-xl main-wide:hidden">
                  ({rankStr(totalScore)})
                </span>
                <span className="hidden group-hover:inline-block mr-2 ml-2 main-wide:ml-0">
                  <span className="mr-1">=</span>
                  <span className="">
                    {Math.floor(bestScoreState.baseScore)}
                  </span>
                  <span className="text-sm">.</span>
                  <span className="text-sm">
                    {(Math.floor(bestScoreState.baseScore * 100) % 100)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                  <span className="ml-0.5 mr-0.5">+</span>
                  <span className="">
                    {Math.floor(bestScoreState.chainScore)}
                  </span>
                  <span className="text-sm">.</span>
                  <span className="text-sm">
                    {(Math.floor(bestScoreState.chainScore * 100) % 100)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                  <span className="ml-0.5 mr-0.5">+</span>
                  <span className="">
                    {Math.floor(bestScoreState.bigScore)}
                  </span>
                  <span className="text-sm">.</span>
                  <span className="text-sm">
                    {(Math.floor(bestScoreState.bigScore * 100) % 100)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                </span>
                <span className="text-xl hidden main-wide:inline">
                  ({rankStr(totalScore)})
                </span>
                <span className="hidden group-hover:inline-block ml-2 mr-2">
                  <span className="hidden main-wide:inline mr-1">-</span>
                  {bestScoreState?.judgeCount.map((j, i) => (
                    <span key={i} className="inline-block">
                      <span className="inline-block w-5 translate-y-0.5 ">
                        <JudgeIcon index={i} />
                      </span>
                      <span className="text-lg mr-2">
                        {bestScoreState?.judgeCount[i]}
                      </span>
                    </span>
                  ))}
                </span>
              </>
            )}
          </p>
          <p className="mt-3">
            <Button
              text={t("start")}
              onClick={() => {
                // 押したときにも再度sessionを初期化
                const sessionId = initSession({
                  cid: props.cid,
                  lvIndex: selectedLevel,
                  brief: props.brief,
                });
                // router.push(`/play?sid=${sessionId}`);  youtubeAPIが初期化されない
                // location.href = `/play?sid=${sessionId}`;  テーマが引き継がれない
                window.open(`/play?sid=${sessionId}`, "_blank")?.focus();
              }}
            />
          </p>
        </>
      ) : (
        <p className="ml-2 ">{t("unavailable")}</p>
      )}
    </>
  );
}
