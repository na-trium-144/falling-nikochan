"use client";

import { getBestScore } from "@/common/bestScore";
import Button from "@/common/button";
import { rankStr } from "@/common/rank";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  cid: string;
}
export function PlayOption(props: Props) {
  const [bestScoreState, setBestScoreState] = useState<number>(0);
  const [origin, setOrigin] = useState<string>("");
  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  useEffect(() => {
    setBestScoreState(getBestScore(props.cid));
    setOrigin(window.location.origin);
    setHasClipboard(!!navigator?.clipboard);
  }, [props]);

  const [auto, setAuto] = useState<boolean>(false);

  return (
    <>
      <p className="mt-2">
        <span className="hidden main-wide:inline-block mr-2">
          共有用リンク:
        </span>
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
      <p className="mt-2">
        <input
          className="ml-1 mr-1"
          type="checkbox"
          id="auto"
          checked={auto}
          onChange={(v) => setAuto(v.target.checked)}
        />
        <label htmlFor="auto">
          <span>オートプレイ</span>
        </label>
      </p>
      <p className="mt-3">
        <Link href={`/play/${props.cid}?auto=${auto ? 1 : 0}`}>
          <Button text="ゲーム開始！" />
        </Link>
      </p>
    </>
  );
}
