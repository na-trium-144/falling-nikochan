"use client";

import { ChartBrief, levelColors, levelTypes } from "@/chartFormat/chart";
import { getBestScore } from "@/common/bestScore";
import Button from "@/common/button";
import { rankStr } from "@/common/rank";
import { initSession, SessionData } from "@/play/session";
import { RightOne, SmilingFace } from "@icon-park/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
        className="text-blue-600 hover:underline"
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
  const [selectedLevel, setSelectedLevel] = useState<number>(0);

  const [bestScoreState, setBestScoreState] = useState<number>(0);
  useEffect(() => {
    setBestScoreState(
      getBestScore(props.cid, props.brief.levels[selectedLevel].hash)
    );
  }, [props, selectedLevel]);

  const [sessionId, setSessionId] = useState<number>();
  const [sessionData, setSessionData] = useState<SessionData>();
  useEffect(() => {
    const data = {
      cid: props.cid,
      lvIndex: selectedLevel,
      brief: props.brief,
    };
    setSessionData(data);
    if (sessionId === undefined) {
      setSessionId(initSession(data));
    } else {
      initSession(data, sessionId);
    }
  }, [sessionId, selectedLevel, props]);

  return (
    <>
      <p>レベルを選択:</p>
      <ul className="ml-2 mt-1 mb-2">
        {props.brief.levels.map((level, i) => (
          <li key={i}>
            <button
              className={
                i === selectedLevel ? "text-blue-600 " : "hover:text-slate-500 "
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
      <p>
        <span className="text-lg font-title">♩</span>
        <span className="ml-1.5 mr-1">=</span>
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
        <span className="mx-3">/</span>
        <span className="inline-block w-5 translate-y-0.5 ">
          <SmilingFace />
        </span>
        <span className="mr-1">✕</span>
        <span className="text-lg">
          {props.brief.levels[selectedLevel]?.noteCount}
        </span>
      </p>
      <p>
        <span>Best Score:</span>
        <span className="inline-block text-xl w-10 text-right">
          {Math.floor(bestScoreState)}
        </span>
        <span>.</span>
        <span className="inline-block w-6">
          {(Math.floor(bestScoreState * 100) % 100).toString().padStart(2, "0")}
        </span>
        {bestScoreState > 0 && (
          <span className="text-xl">({rankStr(bestScoreState)})</span>
        )}
      </p>
      <p className="mt-3">
        <Link href={`/play?sid=${sessionId}`}>
          <Button
            text="ゲーム開始！"
            onClick={() =>
              // 押したときにも再度sessionを初期化
              sessionData && initSession(sessionData, sessionId)
            }
          />
        </Link>
      </p>
    </>
  );
}
