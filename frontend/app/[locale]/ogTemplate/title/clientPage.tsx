"use client";

import { useTheme } from "@/common/theme";
import Title from "@/common/titleLogo";
import BPMSign from "@/play/bpmSign";
import RhythmicalSlime from "@/play/rhythmicalSlime";
import { stepZero } from "@falling-nikochan/chart";

export default function OGTemplate() {
  useTheme();

  // 1rem = 16px の環境でのみ正常に表示される
  return (
    <div
      className="absolute flex flex-col overflow-clip "
      style={{ width: 1200, height: 630 }}
    >
      <Title
        className="absolute top-0 inset-x-0 h-34 scale-320 origin-top "
        anim={false}
      />
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
