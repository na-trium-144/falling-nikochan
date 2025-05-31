"use client";

import {
  ChartBrief,
  levelTypes,
  rankStr,
  RecordGetSummary,
  serializeResultParams,
} from "@falling-nikochan/chart";
import {
  getBestScore,
  ResultData,
  toResultParams,
} from "@/common/bestScore.js";
import Button from "@/common/button.js";
import { FourthNote } from "@/common/fourthNote.js";
import { levelColors } from "@/common/levelColors";
import { initSession } from "@/play/session.js";
import { JudgeIcon } from "@/play/statusBox.js";
import SmilingFace from "@icon-park/react/lib/icons/SmilingFace";
import Timer from "@icon-park/react/lib/icons/Timer";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RecordHistogram } from "@/common/recordHistogram";
import { isStandalone } from "@/common/pwaInstall";
import { useRouter } from "next/navigation";
import { BadgeStatus, getBadge, LevelBadge } from "@/common/levelBadge";
import { SlimeSVG } from "@/common/slime";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight";
import { useShareLink } from "@/common/share";

interface Props {
  locale: string;
  cid: string;
  brief: ChartBrief;
  record: RecordGetSummary[] | null;
}
export function PlayOption(props: Props) {
  const t = useTranslations("share");
  const router = useRouter();

  const [status, setStatus] = useState<BadgeStatus[]>([]);
  useEffect(() => {
    setStatus(
      props.brief?.levels
        // .filter((l) => !l.unlisted)
        .map((l) => getBadge(getBestScore(props.cid, l.hash))) || []
    );
  }, [props.cid, props.brief]);

  // levelが存在しない時 -1
  const [selectedLevel, setSelectedLevel] = useState<number | null>(
    // props.brief.levels.findIndex((l) => !l.unlisted),
    null
  );
  const levelsNum = props.brief.levels.filter((l) => !l.unlisted).length;
  useEffect(() => {
    if (selectedLevel === null && levelsNum === 1) {
      setSelectedLevel(props.brief.levels.findIndex((l) => !l.unlisted));
    }
  }, [props.brief.levels, selectedLevel, levelsNum]);

  return (
    <div
      className={
        "mx-auto mt-4 p-2 " +
        "w-max max-w-full rounded-lg border " +
        "border-sky-200 dark:border-orange-900 " +
        "bg-sky-100/50 dark:bg-orange-950/50 "
      }
    >
      <div className="flex flex-col main-wide:flex-row">
        <p className="flex-none w-max self-begin main-wide:self-center ">
          {t("selectLevel")}:
        </p>
        <ul className="min-w-0 max-w-full grow-0 shrink ml-2 self-center ">
          {props.brief.levels.map(
            (level, i) =>
              level.unlisted || (
                <li
                  key={i}
                  className={
                    "relative leading-0 w-full " +
                    (selectedLevel !== null && selectedLevel >= 0
                      ? "pr-4 "
                      : "pr-2 ")
                  }
                >
                  <LevelButton
                    selected={selectedLevel === i}
                    onClick={() => setSelectedLevel(i)}
                    level={level}
                    status={status.at(i)}
                  />
                  <span
                    className={
                      "absolute inline-block right-0 inset-y-0 my-auto " +
                      "w-4 h-4 translate-x-1/2 z-10 " +
                      "border-l border-b rounded-tr-full " +
                      "rotate-45 origin-center " +
                      "border-slate-400 dark:border-stone-600 " +
                      "bg-white dark:bg-stone-800 " +
                      "invisible " +
                      (selectedLevel === i ? "main-wide:visible " : "")
                    }
                  />
                </li>
              )
          )}
        </ul>
        {levelsNum === 0 && <p>{t("unavailable")}</p>}
        <div
          className={
            "flex-none flex flex-col max-w-full " +
            "mt-2 main-wide:mt-0 " +
            "self-center main-wide:self-stretch "
          }
        >
          <span style={{ flexGrow: selectedLevel || 0 }} />
          <div
            className={
              "flex-none max-w-full px-4 py-2 " +
              "text-center rounded-lg border " +
              "border-slate-400 dark:border-stone-600 " +
              "bg-white dark:bg-stone-800 " +
              "main-wide:transition-all main-wide:duration-200 origin-left " +
              (selectedLevel !== null && selectedLevel >= 0
                ? "scale-100 "
                : "scale-0 px-0! py-0! ")
            }
          >
            {selectedLevel !== null && selectedLevel >= 0 ? (
              <SelectedLevelInfo
                cid={props.cid}
                brief={props.brief}
                record={props.record}
                selectedLevel={selectedLevel}
                locale={props.locale}
              />
            ) : null}
          </div>
          <span style={{ flexGrow: levelsNum - (selectedLevel || 0) - 1 }} />
        </div>
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
              if (isStandalone()) {
                router.push(`/play?sid=${sessionId}`);
              } else {
                window.open(`/play?sid=${sessionId}`, "_blank")?.focus();
              }
            }}
          />
        </p>
      )}
    </div>
  );
}

function LevelButton(props: {
  selected: boolean;
  onClick: () => void;
  level: { name: string; type: string; difficulty: number };
  status: BadgeStatus;
}) {
  return (
    <button
      className={
        "cursor-pointer w-full " +
        "relative rounded px-2 py-0.5 my-0.5 " +
        (props.selected
          ? "shadow-inner bg-sky-300/50 dark:bg-orange-900/50 "
          : "hover:shadow hover:mt-0 hover:mb-1 " +
            "hover:bg-sky-200/50 dark:hover:bg-orange-800/50 " +
            "active:mt-0.5 active:mb-0.5 " +
            "active:shadow-inner active:bg-sky-300/50 dark:active:bg-orange-900/50 ")
      }
      onClick={props.onClick}
    >
      <LevelBadge
        className="absolute top-0.5 -right-3 "
        status={[props.status]}
        levels={[levelTypes.indexOf(props.level.type)]}
      />
      <span className="inline-block text-center truncate w-full ">
        {props.level.name && (
          <span className="mr-2 font-title ">{props.level.name}</span>
        )}
        <span
          className={
            props.selected
              ? levelColors[levelTypes.indexOf(props.level.type)]
              : ""
          }
        >
          <span className="text-sm">{props.level.type}-</span>
          <span className="text-lg">{props.level.difficulty}</span>
        </span>
      </span>
    </button>
  );
}
function SelectedLevelInfo(props: {
  cid: string;
  brief: ChartBrief;
  record: RecordGetSummary[] | null;
  selectedLevel: number;
  locale: string;
}) {
  const t = useTranslations("share");
  const [showBestDetail, setShowBestDetail] = useState(false);

  const selectedRecord =
    props.selectedLevel === null
      ? null
      : props.record?.find(
          (r) => r.lvHash === props.brief.levels[props.selectedLevel]?.hash
        );

  const [bestScoreState, setBestScoreState] = useState<(ResultData | null)[]>(
    []
  );
  const [serializedParam, setSerializedParam] = useState<string[]>([]);
  useEffect(() => {
    const bestScoreState: (ResultData | null)[] = [];
    const serializedParam: string[] = [];
    for (let i = 0; i < props.brief.levels.length; i++) {
      const bestScore = getBestScore(props.cid, props.brief.levels[i].hash);
      bestScoreState.push(bestScore);
      serializedParam.push(
        bestScore
          ? serializeResultParams(
              toResultParams(bestScore, props.brief.levels[i])
            )
          : ""
      );
    }
    setBestScoreState(bestScoreState);
    setSerializedParam(serializedParam);
  }, [props.cid, props.brief]);

  const selectedBestScore = bestScoreState.at(props.selectedLevel);
  const totalScore = selectedBestScore
    ? selectedBestScore.baseScore +
      selectedBestScore.chainScore +
      selectedBestScore.bigScore
    : 0;

  const shareLink = useShareLink(
    props.cid,
    props.brief,
    props.locale,
    serializedParam.at(props.selectedLevel) || "",
    selectedBestScore?.date
  );

  return (
    <>
      <p>{t("chartInfo")}</p>
      <div className="inline-flex flex-col main-wide:flex-row items-baseline">
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
              Math.round(props.brief.levels[props.selectedLevel]?.length) / 60
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
        {t("otherPlayers")}
        {props.record !== null && (
          <span className="ml-2 text-sm">({selectedRecord?.count || 0})</span>
        )}
      </p>
      <span className={props.record === null ? "block " : "hidden "}>
        <SlimeSVG />
        Loading...
      </span>
      {selectedRecord && selectedRecord.count >= 5 && (
        <RecordHistogram
          histogram={selectedRecord.histogram}
          bestScoreTotal={selectedBestScore ? totalScore : null}
        />
      )}
      <button
        className={
          "w-full mt-2 px-2 rounded-lg " +
          "flex flex-col items-center " +
          (selectedBestScore &&
            "cursor-pointer active:shadow-inner active:bg-orange-300 dark:active:bg-sky-800/60 " +
              "hover:shadow hover:bg-orange-300/50 dark:hover:bg-sky-800 ")
        }
        onClick={() =>
          setShowBestDetail(!!selectedBestScore && !showBestDetail)
        }
      >
        <p className="">{t("bestScore")}</p>
        {showBestDetail && selectedBestScore?.date && (
          <span className="text-sm text-slate-500 dark:text-stone-400">
            ({new Date(selectedBestScore.date).toLocaleDateString()})
          </span>
        )}
        <div className="flex flex-row items-center ">
          <span
            className={
              selectedBestScore ? "" : "text-slate-400 dark:text-stone-600 "
            }
          >
            <span className="inline-block text-2xl">
              {Math.floor(totalScore)}
            </span>
            <span className="">.</span>
            <span className="inline-block">
              {(Math.floor(totalScore * 100) % 100).toString().padStart(2, "0")}
            </span>
          </span>
          {selectedBestScore && (
            <span className="text-xl ml-1 ">({rankStr(totalScore)})</span>
          )}
        </div>
        {!showBestDetail && selectedBestScore && (
          <span className="inline-block text-sm">
            {t("detail")}
            <ArrowRight
              className="inline-block align-middle ml-2 "
              theme="filled"
            />
          </span>
        )}
        {showBestDetail && selectedBestScore && (
          <>
            <span className="inline-block ">
              <span className="">
                {Math.floor(selectedBestScore.baseScore)}
              </span>
              <span className="text-sm">.</span>
              <span className="text-sm">
                {(Math.floor(selectedBestScore.baseScore * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
              </span>
              <span className="ml-0.5 mr-0.5">+</span>
              <span className="">
                {Math.floor(selectedBestScore.chainScore)}
              </span>
              <span className="text-sm">.</span>
              <span className="text-sm">
                {(Math.floor(selectedBestScore.chainScore * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
              </span>
              <span className="ml-0.5 mr-0.5">+</span>
              <span className="">{Math.floor(selectedBestScore.bigScore)}</span>
              <span className="text-sm">.</span>
              <span className="text-sm">
                {(Math.floor(selectedBestScore.bigScore * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </span>
            <span className="inline-block ml-2 mr-2 space-x-2 ">
              {selectedBestScore?.judgeCount.map((j, i) => (
                <span key={i} className="inline-block">
                  <span className="inline-block w-5 translate-y-0.5 ">
                    <JudgeIcon index={i} />
                  </span>
                  <span className="text-lg ">{j}</span>
                </span>
              ))}
            </span>
          </>
        )}
      </button>
      {showBestDetail && selectedBestScore && (
        <span className="inline-block space-x-1 mt-1 ">
          {shareLink.toClipboard && (
            <Button text={t("copyScoreLink")} onClick={shareLink.toClipboard} />
          )}
          {shareLink.toAPI && (
            <Button text={t("shareScoreLink")} onClick={shareLink.toAPI} />
          )}
        </span>
      )}
    </>
  );
}
