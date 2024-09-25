"use client";

import { ChartBrief } from "@/chartFormat/chart";
import BackButton from "@/common/backButton";
import { getBestScore } from "@/common/bestScore";
import { Box, Error } from "@/common/box";
import Button from "@/common/button";
import Footer from "@/common/footer";
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
  const [origin, setOrigin] = useState<string>("");
  useEffect(() => setOrigin(window.location.origin), []);

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

  const { screenWidth, screenHeight, rem } = useDisplayMode();
  const isMobile = screenWidth < 40 * rem;

  const ytPlayer = useRef<YouTubePlayer>();

  const [auto, setAuto] = useState<boolean>(false);

  if (errorMsg) {
    return <Error status={errorStatus} message={errorMsg} />;
  }

  return (
    <main className="flex flex-col items-center w-full min-h-screen h-max">
      <div className={"flex-1 p-6 w-full flex items-center justify-center"}>
        <Box
          className="m-auto max-w-full flex flex-col p-6 shrink"
          style={{ flexBasis: "60rem" }}
        >
          {isMobile && <BackButton href="/main/play">ID: {cid}</BackButton>}
          <div className={isMobile ? "" : "flex flex-row-reverse items-center"}>
            <FlexYouTube
              fixedSide="width"
              className={
                isMobile
                  ? "my-2 w-full"
                  : screenWidth < 60 * rem
                  ? "basis-1/3 "
                  : "w-80 "
              }
              isMobile={isMobile}
              id={brief?.ytId}
              control={true}
              ytPlayer={ytPlayer}
            />
            <div className={isMobile ? "" : "flex-1 self-start"}>
              {!isMobile && (
                <BackButton href="/main/play">ID: {cid}</BackButton>
              )}
              <p className="font-title text-2xl">{brief?.title}</p>
              <p className="font-title text-lg">{brief?.composer}</p>
              <p className="text-sm mt-1">
                <span>Chart by</span>
                <span className="ml-3 font-title text-lg">
                  {brief?.chartCreator}
                </span>
              </p>
            </div>
          </div>
          <p className="mt-2">
            {isMobile ? (
              <Link
                className="mx-2 text-blue-600 hover:underline"
                href={`/share/${cid}`}
              >
                共有用リンク
              </Link>
            ) : (
              <>
                <span>共有用リンク:</span>
                <Link
                  className="mx-2 text-blue-600 hover:underline"
                  href={`/share/${cid}`}
                >
                  {origin}/share/{cid}
                </Link>
              </>
            )}
            {navigator && navigator.clipboard && (
              <Button
                text="コピー"
                onClick={() =>
                  navigator.clipboard.writeText(`${origin}/share/${cid}`)
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
      </div>
      <Footer />
    </main>
  );
}
