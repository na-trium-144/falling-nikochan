"use client";

import { Box } from "@/common/box";
import TargetLine from "@/common/targetLine";
import { useDisplayMode } from "@/scale";
import { Youtube } from "@icon-park/react";
import { useEffect, useState } from "react";

export function AboutContent3() {
  const [hostname, setHostname] = useState("");
  useEffect(() => setHostname(window.location.host), []);
  const { screenWidth, rem } = useDisplayMode();
  const isMobile = screenWidth < 40 * rem;

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
            好きな楽曲を
            <wbr />
            使って
            <wbr />
            譜面を
            <wbr />
            作ることが
            <wbr />
            できます。
          </p>
          <p>
            Falling Nikochan では
            <wbr />
            音源を
            <wbr />
            ダウンロード
            <wbr />
            する必要は
            <wbr />
            なく、
            <span className="relative inline-block">
              <Youtube className="absolute left-0.5 bottom-1" theme="filled" />
              <span className="ml-5 mr-1">YouTube</span>
            </span>
            を<wbr />
            埋め込んで
            <wbr />
            音源を
            <wbr />
            再生する
            <wbr />
            ので、
            <wbr />
            YouTube に<wbr />
            アップロード
            <wbr />
            されている
            <wbr />
            楽曲で
            <wbr />
            あれば
            <wbr />
            なんでも
            <wbr />
            使用できます。
          </p>
        </div>
        {screenWidth >= 25 * rem && (
          <Box
            className={
              "rounded-none relative " +
              (isMobile ? "basis-1/3 shrink max-w-32 " : "w-56 h-24 ")
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
        )}
      </div>
      <div className="mb-4 space-y-2 text-center">
        <p>
          作った譜面は、
          <wbr />
          譜面ID (6桁の数字)
          <wbr />を<wbr />
          入力
          <wbr />
          するか、
          <wbr />
          譜面のURL (
          <span className="text-sm">
            {hostname}&#47;<wbr />
            share
            <wbr />
            &#47;*
          </span>
          ) に<wbr />
          アクセス
          <wbr />
          する
          <wbr />
          ことで
          <wbr />
          他の人も
          <wbr />
          遊ぶことが
          <wbr />
          できます。
        </p>
      </div>
    </>
  );
}
