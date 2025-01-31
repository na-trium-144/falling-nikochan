"use client";

import Header from "@/common/header";
import { Box } from "@/common/box";
import Footer from "@/common/footer";
import { PlayOption } from "./playOption";
import { ChartBrief } from "@/chartFormat/chart";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube";
import Link from "next/link";
import Button from "@/common/button";
import { linkStyle1 } from "@/common/linkStyle";
import { isSample } from "@/main/const";
import { International, PlayOne } from "@icon-park/react";

export const dynamic = "force-static";

export default function ShareChart() {
  const searchParams = useSearchParams();
  const cid = searchParams.get("cid") || "";
  // const { res, brief } = await getBrief(cid, true);
  const [brief, setBrief] = useState<ChartBrief | null>(null);

  useEffect(() => {
    try {
      setBrief(JSON.parse("PLACEHOLDER_BRIEF"));
    } catch {
      setBrief({
        title: "placeholder",
        composer: "placeholder",
        chartCreator: "placeholder",
        ytId: "",
        updatedAt: 0,
        published: false,
        levels: [],
      });
    }
  }, [cid]);

  const ytPlayer = useRef<YouTubePlayer>(undefined);
  const [origin, setOrigin] = useState<string>("");
  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    setHasClipboard(!!navigator?.clipboard);
  }, []);

  return (
    <main className="flex flex-col items-center w-full min-h-dvh h-max">
      <Header className="main-wide:hidden">ID: {cid}</Header>
      <div className={"flex-1 p-6 w-full flex items-center justify-center"}>
        {brief !== null && (
          <Box
            className="m-auto max-w-full flex flex-col p-6 shrink"
            style={{ flexBasis: "60rem" }}
          >
            <div className="main-wide:flex main-wide:flex-row-reverse main-wide:items-center">
              <FlexYouTube
                fixedSide="width"
                className={
                  "my-2 w-full " +
                  "main-wide:basis-1/3 " +
                  "share-yt-wide:w-80 "
                }
                id={brief.ytId}
                control={true}
                ytPlayer={ytPlayer}
              />
              <div className="main-wide:flex-1 main-wide:self-start">
                <Header className="hidden main-wide:block mb-2 pl-0">
                  ID: {cid}
                </Header>
                <p className="font-title text-2xl">{brief?.title}</p>
                <p className="font-title text-lg">{brief?.composer}</p>
                <p className="mt-1">
                  <span className="inline-block">
                    <span className="text-sm">Chart by</span>
                    <span className="ml-3 font-title text-lg">
                      {brief.chartCreator}
                    </span>
                  </span>
                  <span className="inline-block ml-3 text-slate-500 dark:text-stone-400 ">
                    <span className="inline-block">
                      ({new Date(brief.updatedAt).toLocaleDateString()})
                    </span>
                    <span>
                      {isSample(cid) ? (
                        <span className="ml-2">
                          <International className="inline-block w-5 translate-y-0.5" />
                          <span>サンプル譜面</span>
                        </span>
                      ) : brief.published ? (
                        <span className="ml-2">
                          <International className="inline-block w-5 translate-y-0.5" />
                          <span>一般公開</span>
                        </span>
                      ) : (
                        <>
                          {/*
              <LinkTwo className="inline-block w-5 translate-y-0.5" />
              <span></span>
            */}
                        </>
                      )}
                    </span>
                    <span className="ml-2">
                      <PlayOne
                        className="inline-block w-5 translate-y-0.5"
                        theme="filled"
                      />
                      <span>{brief.playCount || 0}</span>
                    </span>
                  </span>
                </p>
              </div>
            </div>
            <p className="mt-2">
              <span className="hidden main-wide:inline-block mr-2">
                共有用リンク:
              </span>
              <Link
                className={"inline-block py-2 " + linkStyle1}
                href={`/share/${cid}`}
                prefetch={false}
              >
                <span className="main-wide:hidden">共有用リンク</span>
                <span className="hidden main-wide:inline-block">
                  {origin}/share/{cid}
                </span>
              </Link>
              {hasClipboard && (
                <Button
                  className="ml-2"
                  text="コピー"
                  onClick={() =>
                    navigator.clipboard.writeText(`${origin}/share/${cid}`)
                  }
                />
              )}
            </p>
            <PlayOption cid={cid} brief={brief} />
          </Box>
        )}
      </div>
      <Footer nav />
    </main>
  );
}
