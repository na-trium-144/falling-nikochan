"use client";

import { ChartBrief } from "@/chartFormat/chart";
import { getBestScore } from "@/common/bestScore";
import { Box, Error } from "@/common/box";
import Button from "@/common/button";
import { rankStr } from "@/common/rank";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube";
import { useDisplayMode } from "@/scale";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ShareChart(context: { params: Params }) {
  const cid = context.params.cid;
  const [brief, setBrief] = useState<ChartBrief>();
  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [bestScoreState, setBestScoreState] = useState<number>(0);

  useEffect(() => {
    setBestScoreState(getBestScore(cid));
    void (async () => {
      const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
      if (res.ok) {
        // cidからタイトルなどを取得
        setBrief(await res.json());
        setErrorMsg("");
        setErrorStatus(undefined);
      } else {
        setBrief(undefined);
        setErrorStatus(res.status);
        try {
          setErrorMsg(String((await res.json()).message));
        } catch (e) {
          setErrorMsg(String(e));
        }
      }
    })();
  }, [cid]);

  const { scaledSize, isMobile } = useDisplayMode();

  const ytPlayer = useRef<YouTubePlayer>();

  const [auto, setAuto] = useState<boolean>(false);

  if (errorMsg) {
    return <Error status={errorStatus} message={errorMsg} />;
  }

  return (
    <main
      className="flex p-6 items-center justify-center"
      style={{ ...scaledSize }}
    >
      <Box className="flex flex-col p-6 shrink" style={{ flexBasis: 800 }}>
        <div className="flex flex-row-reverse">
          <FlexYouTube
            className={"block basis-1/3 "}
            isMobile={isMobile}
            id={brief?.ytId}
            control={true}
            ytPlayer={ytPlayer}
          />
          <div className="basis-2/3">
            <div className="mb-2">
              <Link
                href="/"
                className="mr-2 p-2 aspect-square rounded-full text-xl text-bold hover:bg-gray-200"
              >
                ←
              </Link>
              <span className="text-xl">ID: {cid}</span>
            </div>
            <p className="font-title text-2xl">{brief?.title}</p>
            <p className="font-title text-lg">{brief?.composer}</p>
          </div>
        </div>
        <p className="mt-2">
          共有用リンク:
          <Link
            className="mx-2 text-blue-600 hover:underline"
            href={`/share/${cid}`}
          >
            {window.location.origin}/share/{cid}
          </Link>
          {navigator.clipboard && (
            <Button
              text="コピー"
              onClick={() =>
                navigator.clipboard.writeText(
                  `${window.location.origin}/share/${cid}`
                )
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
            {(Math.floor(bestScoreState * 100) % 100)
              .toString()
              .padStart(2, "0")}
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
          <Link href={`/play/${cid}?auto=${auto ? 1 : 0}`}>
            <Button text="ゲーム開始！" />
          </Link>
        </p>
      </Box>
    </main>
  );
}
