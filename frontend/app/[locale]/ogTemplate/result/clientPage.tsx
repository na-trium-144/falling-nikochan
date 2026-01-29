"use client";

import clsx from "clsx/lite";
import Title from "@/common/titleLogo";
import BPMSign from "@/play/bpmSign";
import RhythmicalSlime from "@/play/rhythmicalSlime";
import { useTranslations } from "next-intl";
import { levelTypes, stepZero } from "@falling-nikochan/chart";
import { useEffect, useState } from "react";
import { Box } from "@/common/box";
import { JudgeIcon } from "@/play/statusBox";
import { levelBgColors, levelColors } from "@/common/levelColors";
import {
  IrasutoyaLikeBgInner,
  IrasutoyaLikeGrassInner,
} from "@/common/irasutoyaLike";

export default function OGTemplate() {
  const th = useTranslations("share");
  const t = useTranslations("play.result");
  const ts = useTranslations("play.status");
  const [showDummyData, setShowDummyData] = useState<boolean>(true);
  useEffect(() => {
    setShowDummyData(
      !!Number(new URLSearchParams(window.location.search).get("dummy") || 1)
    );
  }, []);

  // 1rem = 16px の環境でのみ正常に表示される
  return (
    <div
      className="absolute flex flex-row w-full "
      style={{ width: 1200, height: 630 }}
    >
      <IrasutoyaLikeBgInner screenWidth={1200} screenHeight={630} fixedSeed />
      <Title
        className="absolute top-0 left-8 h-26 scale-120 origin-top-left "
        anim={false}
      />
      <div
        className={clsx(
          "absolute top-0 right-0 w-124 pl-4 pb-4 pt-0 pr-0 rounded-bl-xl",
          levelBgColors[1],
          showDummyData || "invisible"
        )}
      >
        <div
          className={clsx(
            "w-full aspect-[16/9] bg-gray-500",
            showDummyData || "invisible"
          )}
        >
          Thumbnail Here
        </div>
      </div>
      <div className="flex-1 min-w-0 ">
        <div className="ml-124 mt-12 text-4xl ">
          <span className="inline-block w-16 ">ID:</span>
          <span className="inline-block ">{showDummyData && 444444}</span>
        </div>
        <div
          className={clsx(
            "ml-20 mt-6 flex flex-row items-baseline",
            "w-full whitespace-nowrap text-ellipsis overflow-x-clip overflow-y-visible",
            showDummyData || "invisible"
          )}
        >
          <span className="text-5xl font-title ">Titleたいとる</span>
          <span className="text-4xl font-title ml-4">/</span>
          <span className="text-4xl font-title ml-4">作曲者Composer</span>
        </div>
        <div
          className={clsx(
            "pl-20 mt-4 font-title text-4xl",
            "w-full whitespace-nowrap text-ellipsis overflow-x-clip overflow-y-visible",
            showDummyData || "invisible"
          )}
        >
          <span className="font-main-ui text-3xl mr-4 ">
            {th("chartCreator")}:
          </span>
          <span>
            chartCreator譜面制作chartCreator譜面制作chartCreator譜面制作chartCreator譜面制作
          </span>
        </div>
        <div
          className={clsx(
            "ml-20 mt-2 flex flex-row items-baseline",
            showDummyData || "invisible"
          )}
        >
          <span className="font-title text-4xl mr-4">LevelName</span>
          <span className={clsx("text-4xl", levelColors[0])}>
            {levelTypes[0]}-
          </span>
          <span className={clsx("text-5xl", levelColors[0])}>44</span>
        </div>
        <Box
          classNameOuter={clsx("flex-1 ml-20 mt-6 h-max")}
          classNameInner={clsx("p-6 flex flex-col items-center", "relative")}
        >
          <div
            className={clsx(
              "absolute bottom-6 right-6 text-3xl text-slate-500",
              showDummyData || "invisible"
            )}
          >
            (2025/01/01)
          </div>

          {/*<p className="text-3xl font-title font-semibold">
            &lt; {t("result")} &gt;
          </p>*/}
          <div className="flex-1 w-full flex flex-row">
            <div className="flex-1 flex flex-col space-y-2 ">
              {["baseScore", "chainBonus", "bigNoteBonus"].map((name, i) => (
                <p
                  key={i}
                  className={clsx(
                    "flex flex-row w-full items-baseline",
                    showDummyData || "invisible"
                  )}
                >
                  <span className="flex-1 text-2xl">{t(name)}:</span>
                  <span className="text-5xl">444</span>
                  <span className="text-3xl">.</span>
                  <span className="text-left w-10 text-3xl">44</span>
                </p>
              ))}
              <div className="border-b mt-2 w-full border-slate-800 dark:border-stone-300" />
              <p
                className={clsx(
                  "flex flex-row w-full items-baseline",
                  showDummyData || "invisible"
                )}
              >
                <span className="flex-1 text-2xl">{t("totalScore")}:</span>
                <span className="text-5xl">444</span>
                <span className="text-3xl">.</span>
                <span className="text-left w-10 text-3xl">44</span>
              </p>
            </div>
            <div className="w-72 flex flex-col items-center justify-center space-y-4">
              <div className={clsx(showDummyData || "invisible")}>
                <span className={clsx("text-3xl")}>(</span>
                <span className="mr-2 text-2xl">{t("playbackRate")}:</span>
                <span className={clsx("text-3xl")}>×1.25)</span>
              </div>
              <div className={clsx(showDummyData || "invisible")}>
                <span className="mr-2 text-2xl ">{t("rank")}:</span>
                <span className={clsx("text-5xl")}>S+</span>
              </div>
              <div className={clsx("text-3xl", showDummyData || "invisible")}>
                <span className="">{t("perfect")}</span>
                <span className="font-bold">+</span>
                <span>!</span>
              </div>
            </div>
          </div>
        </Box>
      </div>
      <div className="w-64 mt-74 ml-16 mr-20 flex flex-col space-y-1.5 ">
        {["good", "ok", "bad", "miss"].map((name, ji) => (
          <div key={ji} className="flex flex-row items-baseline ">
            <span className="flex-1">
              <span className="inline-block w-8 text-2xl translate-y-1 ">
                <JudgeIcon index={ji} />
              </span>
              <span className={clsx("text-2xl", showDummyData || "invisible")}>
                {ts(name)}
              </span>
            </span>
            <span className={clsx("text-4xl", showDummyData || "invisible")}>
              4444
            </span>
          </div>
        ))}
        <div className="flex flex-row items-baseline ">
          <span
            className={clsx("flex-1 text-2xl", showDummyData || "invisible")}
          >
            {ts("big")}
          </span>
          <span className={clsx("text-4xl", showDummyData || "invisible")}>
            4444
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 w-full h-6 -z-10">
        <IrasutoyaLikeGrassInner
          rem={16}
          screenWidth={1200}
          screenHeight={630}
          height={2.5 * 16}
          fixedSeed
        />
        <RhythmicalSlime
          className="z-14 absolute scale-165 origin-bottom-right "
          style={{
            bottom: "100%",
            right: "1rem",
          }}
          signature={[
            {
              step: stepZero(),
              offset: stepZero(),
              barNum: 0,
              bars: [[4, 4, 4, 4]],
            },
          ]}
          getCurrentTimeSec={() => undefined}
          playing={false}
          bpmChanges={[]}
          playbackRate={1}
        />
        <div className="z-13 scale-150 absolute w-full h-full bottom-0 left-0 translate-y-4 origin-bottom-left">
          <BPMSign
            chartPlaying={false}
            chartSeq={null}
            getCurrentTimeSec={() => undefined}
            hasExplicitSpeedChange={false}
            playbackRate={1}
          />
        </div>
      </div>
    </div>
  );
}
