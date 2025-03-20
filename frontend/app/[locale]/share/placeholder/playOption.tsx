"use client";

import {
  ChartBrief,
  levelTypes,
  rankStr,
  RecordGetSummary,
} from "@falling-nikochan/chart";
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
import { Flag, PlayOne, SmilingFace, Timer } from "@icon-park/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Props {
  cid: string;
  brief: ChartBrief;
  record: RecordGetSummary[];
}
export function PlayOption(props: Props) {
  const t = useTranslations("share");

  // levelが存在しない時 -1
  const [selectedLevel, setSelectedLevel] = useState<number | null>(
    // props.brief.levels.findIndex((l) => !l.unlisted),
    null,
  );

  const [bestScoreState, setBestScoreState] = useState<ResultData>();

  useEffect(() => {
    if (selectedLevel !== null && selectedLevel >= 0) {
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
      <div className="mt-4 flex flex-row items-center justify-center ">
        <p className="">{t("selectLevel")}:</p>
        <ul className="ml-2 ">
          {props.brief.levels.map(
            (level, i) =>
              level.unlisted || (
                <li key={i} className="relative w-full pr-4 ">
                  <LevelButton
                    selected={selectedLevel === i}
                    onClick={() => setSelectedLevel(i)}
                    level={level}
                  />
                  <span
                    className={
                      "absolute inline-block right-0 inset-y-0 my-auto " +
                      "w-4 h-4 translate-x-1/2 " +
                      "border-l border-b rounded-tr-full " +
                      "rotate-45 origin-center " +
                      "border-sky-300 dark:border-orange-900 " +
                      "bg-sky-50 dark:bg-orange-950 " +
                      (selectedLevel === i ? "" : "invisible ")
                    }
                  />
                </li>
              ),
          )}
        </ul>
        {!props.brief.levels.some((l) => !l.unlisted) && (
          <p className="ml-2 ">{t("unavailable")}</p>
        )}
        {selectedLevel !== null && selectedLevel >= 0 ? (
          <div
            className={
              "p-4 text-center rounded-lg border " +
              "border-sky-300 dark:border-orange-900 " +
              "bg-sky-50 dark:bg-orange-950 "
            }
          >
            <SelectedLevelInfo
              brief={props.brief}
              record={props.record}
              selectedLevel={selectedLevel}
              bestScoreState={bestScoreState}
            />
          </div>
        ) : null}
      </div>
      {selectedLevel !== null && selectedLevel >= 0 && (
        <p className="mt-3 text-center ">
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
      )}
    </>
  );
}

function LevelButton(props: {
  selected: boolean;
  onClick: () => void;
  level: { name: string; type: string; difficulty: number };
}) {
  return (
    <button
      className={
        "text-left w-full cursor-pointer " +
        "rounded px-2 py-0.5 my-0.5 " +
        (props.selected
          ? "shadow-inner bg-sky-300/50 dark:bg-orange-900/50 "
          : "hover:shadow hover:mt-0 hover:mb-1 hover:bg-sky-200/50 dark:hover:bg-orange-800/50 ")
      }
      onClick={props.onClick}
    >
      {props.level.name && (
        <span className="inline-block mr-2 font-title">{props.level.name}</span>
      )}
      <span
        className={
          "inline-block " +
          (props.selected
            ? levelColors[levelTypes.indexOf(props.level.type)]
            : "")
        }
      >
        <span className="text-sm">{props.level.type}-</span>
        <span className="text-lg">{props.level.difficulty}</span>
      </span>
    </button>
  );
}
function SelectedLevelInfo(props: {
  brief: ChartBrief;
  record: RecordGetSummary[];
  selectedLevel: number;
  bestScoreState: ResultData | undefined;
}) {
  const t = useTranslations("share");
  const [showBestDetail, setShowBestDetail] = useState(false);

  const selectedRecord =
    props.selectedLevel === null
      ? null
      : props.record.find(
          (r) => r.lvHash === props.brief.levels[props.selectedLevel]?.hash,
        );
  const histogramMax = Math.max(
    10,
    selectedRecord?.histogram.reduce((max, h) => Math.max(max, h), 0) || 0,
  );
  const totalScore = props.bestScoreState
    ? props.bestScoreState.baseScore +
      props.bestScoreState.chainScore +
      props.bestScoreState.bigScore
    : 0;

  return (
    <>
      <p>{t("chartInfo")}</p>
      <div className="flex flex-col main-wide:flex-row items-baseline">
        <div className="">
          <span className="text-lg mx-1.5 ">
            <FourthNote />
          </span>
          <span className="mr-1">=</span>
          <span className="text-lg">
            {props.brief.levels[props.selectedLevel]?.bpmMin}
          </span>
          {props.brief.levels[props.selectedLevel]?.bpmMin !==
            props.brief.levels[props.selectedLevel]?.bpmMax && (
            <>
              <span className="ml-1 mr-1">〜</span>
              <span className="text-lg">
                {props.brief.levels[props.selectedLevel]?.bpmMax}
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
              Math.round(props.brief.levels[props.selectedLevel]?.length) / 60,
            )}
          </span>
          <span className="text-lg">:</span>
          <span className="text-lg">
            {(Math.round(props.brief.levels[props.selectedLevel]?.length) % 60)
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
            {props.brief.levels[props.selectedLevel]?.noteCount}
          </span>
        </div>
      </div>
      <p className="mt-2 ">
        {t("otherPlayers")}:
        <span className="ml-2 text-slate-500 dark:text-stone-400 ">
          <PlayOne theme="filled" className="inline-block align-middle mr-1 " />
          <span className="text-sm">{selectedRecord?.count || 0}</span>
        </span>
      </p>
      {selectedRecord && selectedRecord.count >= 10 && (
        <div className="inline-flex flex-row w-max text-xs/2 mb-2 text-left align-middle mx-2 ">
          {selectedRecord?.histogram.map((h, i) => (
            <div key={i} className="w-4">
              <div className="h-6 relative border-b border-slate-500 dark:border-stone-400 ">
                <div
                  className={
                    "absolute inset-x-0 bottom-0 " +
                    (props.bestScoreState &&
                    totalScore >= i * 10 &&
                    totalScore < (i + 1) * 10
                      ? "bg-orange-300 dark:bg-sky-800 "
                      : "bg-slate-500 dark:bg-slate-400 ")
                  }
                  style={{
                    height: (h / histogramMax) * 100 + "%",
                  }}
                />
              </div>
              <div>{[0, 7, 10, 12].includes(i) && i * 10}</div>
            </div>
          ))}
        </div>
      )}
      <button
        className={
          "w-full mt-2 px-2 rounded-lg " +
          "flex flex-col items-center " +
          (props.bestScoreState &&
            "cursor-pointer active:shadow-inner active:bg-orange-300 dark:active:bg-sky-800/60 " +
              "hover:shadow hover:bg-orange-300/50 dark:hover:bg-sky-800 ")
        }
        onClick={() =>
          setShowBestDetail(!!props.bestScoreState && !showBestDetail)
        }
      >
        <p className="">{t("bestScore")}</p>
        <div className="flex flex-row items-center ">
          <span
            className={
              props.bestScoreState ? "" : "text-slate-400 dark:text-stone-600 "
            }
          >
            <span className="inline-block text-2xl w-12 text-right">
              {Math.floor(totalScore)}
            </span>
            <span className="">.</span>
            <span className="inline-block w-6">
              {(Math.floor(totalScore * 100) % 100).toString().padStart(2, "0")}
            </span>
          </span>
          {props.bestScoreState && (
            <span className="text-xl">({rankStr(totalScore)})</span>
          )}
        </div>
        {showBestDetail && props.bestScoreState && (
          <>
            <span className="inline-block ">
              <span className="">
                {Math.floor(props.bestScoreState.baseScore)}
              </span>
              <span className="text-sm">.</span>
              <span className="text-sm">
                {(Math.floor(props.bestScoreState.baseScore * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
              </span>
              <span className="ml-0.5 mr-0.5">+</span>
              <span className="">
                {Math.floor(props.bestScoreState.chainScore)}
              </span>
              <span className="text-sm">.</span>
              <span className="text-sm">
                {(Math.floor(props.bestScoreState.chainScore * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
              </span>
              <span className="ml-0.5 mr-0.5">+</span>
              <span className="">
                {Math.floor(props.bestScoreState.bigScore)}
              </span>
              <span className="text-sm">.</span>
              <span className="text-sm">
                {(Math.floor(props.bestScoreState.bigScore * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </span>
            <span className="inline-block ml-2 mr-2">
              {props.bestScoreState?.judgeCount.map((j, i) => (
                <span key={i} className="inline-block">
                  <span className="inline-block w-5 translate-y-0.5 ">
                    <JudgeIcon index={i} />
                  </span>
                  <span className="text-lg mr-2">
                    {props.bestScoreState?.judgeCount[i]}
                  </span>
                </span>
              ))}
            </span>
          </>
        )}
      </button>
    </>
  );
}
