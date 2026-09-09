"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { fetchBackend } from "./fetch.js";
import Music from "@icon-park/react/lib/icons/Music.js";
import PlayOne from "@icon-park/react/lib/icons/PlayOne.js";
import { Box } from "./box.js";
import CountUp from "react-countup";

const StatsDataSchema = () =>
  v.object({
    chartCount: v.number(),
    playCount: v.number(),
  });

export function StatsDisplay(props: { statsVisible: boolean }) {
  const t = useTranslations("main.stats");
  const [chartCount, setChartCount] = useState<number | undefined>(undefined);
  const [playCount, setPlayCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setChartCount(500);
      setPlayCount(444444);
    }
    fetchBackend()
      .get("/api/stats")
      .json((json) => {
        const stats = v.parse(StatsDataSchema(), json);
        setChartCount(stats.chartCount);
        setPlayCount(stats.playCount);
      });
  }, []);

  return (
    <div className="w-full max-w-main px-3 mb-6 main-wide:px-6 main-wide:mb-8 grid-centering">
      <Box classNameInner="flex flex-row items-center" padding={4}>
        <div className="shrink w-36 min-w-0 flex items-center gap-2">
          <Music className="text-3xl text-sky-600 dark:text-sky-400" />
          <div className="flex-1 min-w-0 flex flex-col items-center">
            <span className="text-sm">{t("chartCount")}</span>
            {chartCount && props.statsVisible ? (
              <CountUp
                className="text-2xl bold-by-stroke fg-bright"
                end={chartCount}
                duration={1}
              />
            ) : (
              <span className="text-2xl bold-by-stroke fg-bright">-</span>
            )}
          </div>
        </div>
        <div className="w-0 h-[75%] mx-4 border-l border-current/50" />
        <div className="shrink w-36 min-w-0 flex items-center gap-2">
          <PlayOne className="text-3xl text-amber-600 dark:text-amber-400" />
          <div className="flex-1 min-w-0 flex flex-col items-center">
            <span className="text-sm">{t("playCount")}</span>
            {playCount && props.statsVisible ? (
              <CountUp
                className="text-2xl bold-by-stroke fg-bright"
                end={playCount}
                duration={1}
              />
            ) : (
              <span className="text-2xl bold-by-stroke fg-bright">-</span>
            )}
          </div>
        </div>
      </Box>
    </div>
  );
}
