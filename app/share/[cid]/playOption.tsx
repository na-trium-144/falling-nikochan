"use client";

import { ChartBrief, levelColors, levelTypes } from "@/chartFormat/chart";
import { clearBestScore, getBestScore, ResultData } from "@/common/bestScore";
import Button from "@/common/button";
import { FourthNote } from "@/common/fourthNote";
import { linkStyle1, linkStyle2 } from "@/common/linkStyle";
import { rankStr } from "@/common/rank";
import { initSession, SessionData } from "@/play/session";
import { JudgeIcon } from "@/play/statusBox";
import { PlayOne, RightOne, SmilingFace, Timer } from "@icon-park/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function PlayCount(props: { count: number }) {
  return (
    <>
      <PlayOne className="inline-block w-5 translate-y-0.5" theme="filled" />
      <span>{props.count}</span>
    </>
  );
}

interface Props {
  cid: string;
  brief: ChartBrief;
}
export function ShareLink(props: Props) {
  const [origin, setOrigin] = useState<string>("");
  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    setHasClipboard(!!navigator?.clipboard);
  }, [props]);
  return (
    <p className="mt-2">
      <span className="hidden main-wide:inline-block mr-2">共有用リンク:</span>
      <Link
        className={"inline-block py-2 " + linkStyle1}
        href={`/share/${props.cid}`}
      >
        <span className="main-wide:hidden">共有用リンク</span>
        <span className="hidden main-wide:inline-block">
          {origin}/share/{props.cid}
        </span>
      </Link>
      {hasClipboard && (
        <Button
          className="ml-2"
          text="コピー"
          onClick={() =>
            navigator.clipboard.writeText(`${origin}/share/${props.cid}`)
          }
        />
      )}
    </p>
  );
}
export function PlayOption(props: Props) {
  const router = useRouter();

  const [selectedLevel, setSelectedLevel] = useState<number>(0);

  const [bestScoreState, setBestScoreState] = useState<ResultData>();
  const totalScore = bestScoreState
    ? bestScoreState.baseScore +
      bestScoreState.chainScore +
      bestScoreState.bigScore
    : 0;

  useEffect(() => {
    const data = getBestScore(props.cid, selectedLevel);
    if (data && data.levelHash === props.brief.levels[selectedLevel].hash) {
      setBestScoreState(data);
    } else {
      setBestScoreState(undefined);
      clearBestScore(props.cid, selectedLevel);
    }
  }, [props, selectedLevel]);

  return (
    <>
      <p>レベルを選択:</p>
      <ul className="ml-2 mt-1 mb-2">
        {props.brief.levels.map((level, i) => (
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
        ))}
      </ul>
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
          (bestScoreState ? "hover:bg-amber-50 hover:dark:bg-amber-950 " : "text-slate-400 dark:text-stone-600 ")
        }
      >
        <span className="text-black dark:text-white ">Best Score:</span>
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
              <span className="">{Math.floor(bestScoreState.baseScore)}</span>
              <span className="text-sm">.</span>
              <span className="text-sm">
                {(Math.floor(bestScoreState.baseScore * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
              </span>
              <span className="ml-0.5 mr-0.5">+</span>
              <span className="">{Math.floor(bestScoreState.chainScore)}</span>
              <span className="text-sm">.</span>
              <span className="text-sm">
                {(Math.floor(bestScoreState.chainScore * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
              </span>
              <span className="ml-0.5 mr-0.5">+</span>
              <span className="">{Math.floor(bestScoreState.bigScore)}</span>
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
          text="ゲーム開始！"
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
  );
}
