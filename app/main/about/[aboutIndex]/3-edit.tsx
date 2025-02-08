"use client";

import { Box } from "@/common/box.js";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import { Youtube } from "@icon-park/react";

export function AboutContent3() {
  const { screenWidth, rem, isMobileMain } = useDisplayMode();

  return (
    <>
      <div
        className={
          "flex flex-row space-x-2 mb-4 items-center " +
          "main-wide:flex-col main-wide:space-x-0 main-wide:space-y-2 " +
          "main-wide:mb-4 "
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
          <p>
            音源を
            <wbr />
            再配布
            <wbr />
            している
            <wbr />
            わけでは
            <wbr />
            ないので、
            <span className="text-sm mx-1">
              (違法
              <wbr />
              アップロード
              <wbr />
              されている
              <wbr />
              ものや YouTube 埋め込み
              <wbr />
              での
              <wbr />
              利用を
              <wbr />
              禁止
              <wbr />
              されている
              <wbr />
              もの
              <wbr />
              などを
              <wbr />
              除き)
            </span>
            ほとんどの
            <wbr />
            場合
            <wbr />
            著作権などで
            <wbr />
            問題に
            <wbr />
            なる
            <wbr />
            ことは
            <wbr />
            ありません。
          </p>
        </div>
        {screenWidth >= 25 * rem && (
          <Box
            className={
              "rounded-none! relative " +
              "basis-1/3 shrink max-w-32 h-48 " +
              "main-wide:basis-auto main-wide:shrink-0 main-wide:max-w-56 main-wide:w-56 main-wide:h-24 "
            }
          >
            <div
              className={
                "absolute bg-amber-600 rounded-sm m-1 " +
                "top-0 inset-x-0 p-1 pl-10 h-12 " +
                "main-wide:left-auto main-wide:pl-1 main-wide:pb-3 main-wide:w-20 main-wide:h-14 "
              }
            >
              <div className="bg-black w-full h-full text-center flex items-center justify-center">
                <Youtube
                  className="inline-block w-max text-red-600 text-4xl"
                  theme="filled"
                />
              </div>
            </div>
            <TargetLine left={0} right={0} bottom={isMobileMain ? 30 : 15} />
            <div
              className="absolute "
              style={{
                width: 20,
                height: 20,
                left: 40,
                bottom: isMobileMain ? 35 : 20,
              }}
            >
              <img
                src={process.env.ASSET_PREFIX + `/assets/nikochan0.svg`}
                className="w-full h-full "
              />
            </div>
            <div
              className="absolute "
              style={{
                width: 20,
                height: 20,
                left: 70,
                bottom: isMobileMain ? 70 : 55,
              }}
            >
              <img
                src={process.env.ASSET_PREFIX + `/assets/nikochan0.svg`}
                className="w-full h-full "
              />
            </div>
          </Box>
        )}
      </div>
      <div className="mb-4 space-y-2 text-center">
        <p>
          譜面を作って Falling Nikochan の
          <wbr />
          サーバーに
          <wbr />
          アップロード
          <wbr />
          すると、
          <wbr />
          譜面ID (6桁の数字) が<wbr />
          発行されます。
          <wbr />
        </p>
        <p>
          その譜面ID
          <wbr />
          または
          <wbr />
          譜面のURL
          <span className="text-sm mx-1">
            (nikochan.
            <wbr />
            natrium144.
            <wbr />
            org
            <wbr />
            &#47;
            <wbr />
            share
            <wbr />
            &#47;〜)
          </span>
          を<wbr />
          SNS
          <wbr />
          などで
          <wbr />
          共有する
          <wbr />
          ことで、
          <wbr />
          遊んで
          <wbr />
          もらう
          <wbr />
          ことが
          <wbr />
          できます。
        </p>
      </div>
    </>
  );
}
