"use client";

import Title from "@/common/titleLogo";
import BPMSign from "@/play/bpmSign";
import RhythmicalSlime from "@/play/rhythmicalSlime";
import { stepZero } from "@falling-nikochan/chart";
import {
  IrasutoyaLikeBgInner,
  IrasutoyaLikeGrassInner,
} from "@/common/irasutoyaLike";
import { useEffect } from "react";

export default function OGTemplate() {
  // 1rem = 16px の環境でのみ正常に表示される
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      const search = new URLSearchParams(location.search);
      if (e.key === "ArrowRight") {
        search.set("s", String(Number(search.get("s") ?? "0") + 1));
        location.href = location.pathname + "?" + search.toString();
      } else if (e.key === "ArrowLeft") {
        search.set(
          "s",
          String(Math.max(0, Number(search.get("s") ?? "0") - 1))
        );
        location.href = location.pathname + "?" + search.toString();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
    };
  }, []);
  return (
    <div
      className="absolute isolate flex flex-col overflow-clip "
      style={{ width: 1200, height: 630 }}
    >
      <IrasutoyaLikeBgInner
        screenWidth={1200}
        screenHeight={630}
        fixedSeed
        className="absolute"
      />
      <Title
        className="absolute top-0 inset-x-0 h-34 scale-320 origin-top "
        anim={false}
      />
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
          className="z-14 absolute scale-150 origin-bottom-right "
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
