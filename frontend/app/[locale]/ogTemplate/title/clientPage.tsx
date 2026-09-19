"use client";

import Title from "@/common/titleLogo";
import BPMSign from "@/play/bpmSign";
import RhythmicalSlime from "@/play/rhythmicalSlime";
import { stepZero } from "@falling-nikochan/chart";
import {
  IrasutoyaLikeBgInner,
  IrasutoyaLikeGrassInner,
} from "@/common/irasutoyaLike";
import { useEffect, useMemo, useState } from "react";

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

  const [mode, setMode] = useState<null | string>(null);
  useEffect(() => {
    setMode(new URLSearchParams(window.location.search).get("mode"));
  }, []);

  const options = useMemo(
    () =>
      mode === "twitter"
        ? {
            width: 1200,
            height: 400,
            titleHeight: 100,
            titleScale: "288%",
            bpmSign: false,
            slime: false,
          }
        : {
            width: 1200,
            height: 630,
            titleHeight: 136,
            titleScale: "320%",
            bpmSign: true,
            slime: true,
          },
    [mode]
  );

  return (
    <div
      className="absolute isolate flex flex-col overflow-clip "
      style={{ width: options.width, height: options.height }}
    >
      <IrasutoyaLikeBgInner
        screenWidth={options.width}
        screenHeight={options.height}
        fixedSeed
        className="absolute"
      />
      <Title
        className="absolute top-0 inset-x-0 origin-top "
        style={{ height: options.titleHeight, scale: options.titleScale }}
        anim={false}
      />
      <div className="absolute bottom-0 w-full h-6">
        <IrasutoyaLikeGrassInner
          rem={16}
          screenWidth={options.width}
          screenHeight={options.height}
          height={2.5 * 16}
          fixedSeed
          classNameFar="absolute"
          classNameNear="absolute"
        />
        {options.slime && (
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
            startsJumping={null}
          />
        )}
        {options.bpmSign && (
          <div className="z-13 scale-150 absolute w-full h-full bottom-0 left-0 translate-y-4 origin-bottom-left">
            <BPMSign
              chartPlaying={false}
              chartSeq={null}
              getCurrentTimeSec={() => undefined}
              hasExplicitSpeedChange={false}
              playbackRate={1}
            />
          </div>
        )}
      </div>
    </div>
  );
}
