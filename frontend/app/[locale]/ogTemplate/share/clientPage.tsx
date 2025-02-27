"use client";

import { useTheme } from "@/common/theme";
import Title from "@/common/titleLogo";
import BPMSign from "@/play/bpmSign";
import RhythmicalSlime from "@/play/rhythmicalSlime";
import { useTranslations } from "next-intl";
import { stepZero } from "@falling-nikochan/chart";
import { useEffect, useState } from "react";

export default function OGTemplate() {
  const t = useTranslations("share");
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
      className="absolute flex flex-col "
      style={{ width: 1200, height: 630 }}
    >
      <Title
        className="absolute top-0 left-0 h-25 scale-190 origin-top-left "
        anim={false}
      />
      <div
        className={
          "absolute top-0 right-0 w-[480px] aspect-[16/9] bg-gray-500 " +
          (showDummyData ? "" : "invisible")
        }
      >
        Thumbnail Here
      </div>
      <div className="pl-20 mt-48 text-5xl ">
        <span className="inline-block w-24 ">ID:</span>
        <span className="inline-block ">{showDummyData && 444444}</span>
      </div>
      <div
        className={
          "pl-20 mt-10 text-7xl font-title " +
          "w-full text-nowrap text-ellipsis overflow-x-clip overflow-y-visible " +
          (showDummyData ? "" : "invisible")
        }
      >
        TitleたいとるTitleたいとるTitleたいとるTitleたいとるTitleたいとるTitleたいとる
      </div>
      <div
        className={
          "pl-20 mt-6 text-5xl font-title " +
          "w-full text-nowrap text-ellipsis overflow-x-clip overflow-y-visible " +
          (showDummyData ? "" : "invisible")
        }
      >
        composer作曲者composer作曲者composer作曲者composer作曲者composer作曲者composer作曲者
      </div>
      <div
        className={
          "pl-20 mt-6 font-title text-5xl " +
          "w-full text-nowrap text-ellipsis overflow-x-clip overflow-y-visible " +
          (showDummyData ? "" : "invisible")
        }
      >
        <span
          className="font-main-ui text-4xl mr-5 "
        >
          {t("chartCreator")}:
        </span>
        <span>
          chartCreator譜面制作chartCreator譜面制作chartCreator譜面制作chartCreator譜面制作
        </span>
      </div>
      <div className="absolute bottom-0 w-full h-6">
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
