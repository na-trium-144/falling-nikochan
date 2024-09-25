"use client";

import { Box } from "@/common/box";
import TargetLine from "@/common/targetLine";
import { useDisplayMode } from "@/scale";
import { Youtube } from "@icon-park/react";
import { useEffect, useState } from "react";

export function AboutContent3() {
  const [hostname, setHostname] = useState("");
  useEffect(() => setHostname(window.location.host), []);
  const { isMobile } = useDisplayMode();

  return (
    <>
      <div
        className={
          isMobile
            ? "flex flex-row space-x-2 mb-4 "
            : "flex flex-col space-y-2 items-center mb-4 "
        }
      >
        <div className="flex-1 space-y-2 text-center">
          <p>
            好きな楽曲を使って{isMobile && <br />}譜面を作ることができます。
          </p>
          <p>
            FallingNikochanでは{isMobile && <br />}
            音源をダウンロードする必要はなく、
            <br />
            <span className="relative inline-block w-5">
              <Youtube
                className="absolute left-0 bottom-0 translate-y-1"
                theme="filled"
              />
            </span>
            YouTube を埋め込んで{isMobile && <br />}音源を再生するので、
            <br />
            YouTubeにアップロードされている{isMobile && <br />}
            楽曲であればなんでも使用できます。
          </p>
          {/*<p>
          FallingNikochanはYouTubeの動画を再生しているだけなので、
          <br />
          権利的な問題も発生しません。
          <br />
          (FallingNikochanで音源を再生するとYouTube上の元の動画の再生回数が1増えます)
        </p>*/}
        </div>
        <Box
          className={
            "rounded-none relative " + (isMobile ? "h-48 w-32 " : "w-56 h-24 ")
          }
        >
          <div
            className={
              "absolute bg-amber-700 rounded-sm m-1 " +
              (isMobile
                ? "top-0 inset-x-0 p-1 pl-10 h-12"
                : "top-0 right-0 p-1 pb-2 w-20 h-14 ")
            }
          >
            <div className="bg-black w-full h-full text-center flex items-center justify-center">
              <Youtube
                className="inline-block w-max text-red-600 text-4xl"
                theme="filled"
              />
            </div>
          </div>
          <TargetLine left={0} right={0} bottom={isMobile ? 30 : 15} />
          <div
            className="absolute "
            style={{
              width: 20,
              height: 20,
              left: 40,
              bottom: isMobile ? 35 : 20,
            }}
          >
            <img src={`/nikochan0.svg`} className="w-full h-full " />
          </div>
          <div
            className="absolute "
            style={{
              width: 20,
              height: 20,
              left: 70,
              bottom: isMobile ? 70 : 55,
            }}
          >
            <img src={`/nikochan0.svg`} className="w-full h-full " />
          </div>
        </Box>
      </div>
      <div className="mb-4 space-y-2 text-center">
        <p>
          作った譜面は、譜面ID (6桁の数字) を入力するか
          <br />
          譜面のURL (<span className="text-sm">{hostname}/share/*</span>)
          <br />
          にアクセスすることで他の人も遊ぶことができます。
        </p>
      </div>
    </>
  );
}
