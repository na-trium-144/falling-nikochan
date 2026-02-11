"use client";

import clsx from "clsx/lite";
import Title from "@/common/titleLogo";
import BPMSign from "@/play/bpmSign";
import RhythmicalSlime from "@/play/rhythmicalSlime";
import { useTranslations } from "next-intl";
import { stepZero } from "@falling-nikochan/chart";
import { useEffect, useState } from "react";
import {
  IrasutoyaLikeBgInner,
  IrasutoyaLikeGrassInner,
} from "@/common/irasutoyaLike";

export default function OGTemplate() {
  const t = useTranslations("share");
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
      <IrasutoyaLikeBgInner
        screenWidth={1200}
        screenHeight={630}
        fixedSeed
        className="absolute"
      />
      <Title
        className="absolute top-0 left-0 h-25 scale-190 origin-top-left "
        anim={false}
      />
      <div
        className={clsx(
          "absolute top-0 right-0 w-124 pl-4 pb-4 pt-0 pr-0 rounded-bl-xl",
          "bg-amber-500",
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
      <div className="pl-20 mt-50 text-5xl ">
        <span className="inline-block w-24 ">ID:</span>
        <span className="inline-block ">{showDummyData && 444444}</span>
      </div>
      <div
        className={clsx(
          "pl-20 mt-12 text-7xl font-title",
          "w-full whitespace-nowrap text-ellipsis overflow-x-clip overflow-y-visible",
          showDummyData || "invisible"
        )}
      >
        TitleたいとるTitleたいとるTitleたいとるTitleたいとるTitleたいとるTitleたいとる
      </div>
      <div
        className={clsx(
          "pl-20 mt-4 text-5xl font-title",
          "w-full whitespace-nowrap text-ellipsis overflow-x-clip overflow-y-visible",
          showDummyData || "invisible"
        )}
      >
        composer作曲者composer作曲者composer作曲者composer作曲者composer作曲者composer作曲者
      </div>
      <div
        className={clsx(
          "pl-20 mt-4 font-title text-5xl",
          "w-full whitespace-nowrap text-ellipsis overflow-x-clip overflow-y-visible",
          showDummyData || "invisible"
        )}
      >
        <span className="font-main-ui text-4xl mr-5 ">
          {t("chartCreator")}:
        </span>
        <span>
          chartCreator譜面制作chartCreator譜面制作chartCreator譜面制作chartCreator譜面制作
        </span>
      </div>
      <div className="absolute bottom-0 w-full h-6">
        <IrasutoyaLikeGrassInner
          rem={16}
          screenWidth={1200}
          screenHeight={630}
          height={2.5 * 16}
          fixedSeed
          classNameFar="absolute"
          classNameNear="absolute"
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
