"use client";

import { useTheme } from "@/common/theme";
import Title from "@/common/titleLogo";
import BPMSign from "@/play/bpmSign";
import RhythmicalSlime from "@/play/rhythmicalSlime";
import { useTranslations } from "next-intl";
import { levelTypes, stepZero } from "@falling-nikochan/chart";
import { useEffect, useState } from "react";
import { Box } from "@/common/box";
import { JudgeIcon } from "@/play/statusBox";
import { levelBgColors, levelColors } from "@/common/levelColors";

export default function OGTemplate() {
  const th = useTranslations("share");
  const t = useTranslations("play.result");
  const ts = useTranslations("play.status");
  useTheme();
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
      <Title
        className="absolute top-0 left-8 h-26 scale-120 origin-top-left "
        anim={false}
      />
      <div
        className={
          "absolute top-0 right-0 w-124 pl-4 pb-4 pt-0 pr-0 rounded-bl-xl " +
          levelBgColors[1]
        }
      >
        <div
          className={
            "w-full aspect-[16/9] bg-gray-500 " +
            (showDummyData ? "" : "invisible")
          }
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
          className={
            "ml-20 mt-6 flex flex-row items-baseline " +
            "w-full text-nowrap text-ellipsis overflow-x-clip overflow-y-visible " +
            (showDummyData ? "" : "invisible")
          }
        >
          <span className="text-5xl font-title ">Titleたいとる</span>
          <span className="text-4xl font-title ml-4">/</span>
          <span className="text-4xl font-title ml-4">作曲者Composer</span>
        </div>
        <div
          className={
            "pl-20 mt-4 font-title text-4xl " +
            "w-full text-nowrap text-ellipsis overflow-x-clip overflow-y-visible " +
            (showDummyData ? "" : "invisible")
          }
        >
          <span className="font-main-ui text-3xl mr-4 ">
            {th("chartCreator")}:
          </span>
          <span>
            chartCreator譜面制作chartCreator譜面制作chartCreator譜面制作chartCreator譜面制作
          </span>
        </div>
        <div
          className={
            "ml-20 mt-2 flex flex-row items-baseline " +
            (showDummyData ? "" : "invisible")
          }
        >
          <span className="font-title text-4xl mr-4">LevelName</span>
          <span className={"text-4xl " + levelColors[0]}>{levelTypes[0]}-</span>
          <span className={"text-5xl " + levelColors[0]}>44</span>
        </div>
        <Box
          className={
            "flex-1 ml-20 mt-6 h-max p-6 flex flex-col items-center " +
            "relative "
          }
        >
          <div
            className={
              "absolute bottom-6 right-6 text-3xl text-slate-500 " +
              (showDummyData ? "" : "invisible")
            }
          >
            (2025/01/01)
          </div>

          {/*<p className="text-3xl font-title font-bold">
            &lt; {t("result")} &gt;
          </p>*/}
          <div className="flex-1 w-full flex flex-row">
            <div className="flex-1 flex flex-col space-y-2 ">
              {["baseScore", "chainBonus", "bigNoteBonus"].map((name, i) => (
                <p
                  key={i}
                  className={
                    "flex flex-row w-full items-baseline " +
                    (showDummyData ? "" : "invisible")
                  }
                >
                  <span className="flex-1 text-2xl">{t(name)}:</span>
                  <span className="text-5xl">444</span>
                  <span className="text-3xl">.</span>
                  <span className="text-left w-10 text-3xl">44</span>
                </p>
              ))}
              <div className="border-b mt-2 w-full border-slate-800 dark:border-stone-300" />
              <p
                className={
                  "flex flex-row w-full items-baseline " +
                  (showDummyData ? "" : "invisible")
                }
              >
                <span className="flex-1 text-2xl">{t("totalScore")}:</span>
                <span className="text-5xl">444</span>
                <span className="text-3xl">.</span>
                <span className="text-left w-10 text-3xl">44</span>
              </p>
            </div>
            <div className="w-72 flex flex-col items-center justify-center space-y-4">
              <div className={showDummyData ? "" : "invisible"}>
                <span className="mr-2 text-2xl ">{t("rank")}:</span>
                <span className={"text-5xl"}>S+</span>
              </div>
              <div className={"text-3xl " + (showDummyData ? "" : "invisible")}>
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
              <span
                className={"text-2xl " + (showDummyData ? "" : "invisible")}
              >
                {ts(name)}
              </span>
            </span>
            <span className={"text-4xl " + (showDummyData ? "" : "invisible")}>
              4444
            </span>
          </div>
        ))}
        <div className="flex flex-row items-baseline ">
          <span
            className={"flex-1 text-2xl " + (showDummyData ? "" : "invisible")}
          >
            {ts("big")}
          </span>
          <span className={"text-4xl " + (showDummyData ? "" : "invisible")}>
            4444
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 w-full h-6 -z-10">
        <div
          className={
            "-z-30 absolute inset-x-0 bottom-0 " +
            "bg-gradient-to-t from-lime-600 via-lime-500 to-lime-200 " +
            "dark:from-lime-900 dark:via-lime-800 dark:to-lime-700 "
          }
          style={{ top: "-1rem" }}
        />
        <RhythmicalSlime
          className="-z-10 absolute scale-150 origin-bottom-right "
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
        />
        <div className="scale-150 absolute w-full h-full bottom-0 left-0 origin-bottom-left">
          <BPMSign
            chartPlaying={false}
            chartSeq={null}
            getCurrentTimeSec={() => undefined}
            hasExplicitSpeedChange={false}
          />
        </div>
      </div>
    </div>
  );
}
