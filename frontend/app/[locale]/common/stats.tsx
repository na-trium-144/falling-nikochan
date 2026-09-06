"use client";

import clsx from "clsx/lite";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { fetchBackend } from "./fetch.js";
import Music from "@icon-park/react/lib/icons/Music.js";
import GameHandle from "@icon-park/react/lib/icons/GameHandle.js";
import { ButtonHighlight } from "./button.jsx";

const StatsDataSchema = () =>
  v.object({
    chartCount: v.number(),
    playCount: v.number(),
  });
type StatsData = v.InferOutput<ReturnType<typeof StatsDataSchema>>;

export function StatsDisplay() {
  const t = useTranslations("main.stats");
  const [stats, setStats] = useState<StatsData>();

  useEffect(() => {
    fetchBackend()
      .get("/api/stats")
      .json((json) => setStats(v.parse(StatsDataSchema(), json)))
      .catch(() => {});
  }, []);

  return (
    <div className="w-full max-w-main px-3 mb-6 main-wide:px-6 main-wide:mb-8 flex justify-center">
      <div
        className={clsx(
          "fn-flat-button fn-selected fn-plain rounded-sq-2xl",
          "flex flex-row items-center justify-center gap-6 sm:gap-12",
          "px-6 py-3.5 shadow-sm shadow-slate-500/20 dark:shadow-stone-950/40"
        )}
      >
        <span className="fn-glass-1" />
        <span className="fn-glass-2" />
        <ButtonHighlight />
        <div className="flex items-center gap-2 sm:gap-3">
          <Music className="text-xl sm:text-2xl text-sky-600 dark:text-sky-400" />
          <div className="flex flex-col items-start font-title">
            <span className="text-xs text-dim leading-none mb-1">
              {t("chartCount")}
            </span>
            <span className="text-lg sm:text-xl font-bold fg-bright leading-none">
              {stats !== undefined ? stats.chartCount.toLocaleString() : "-"}
            </span>
          </div>
        </div>
        <div className="w-px h-8 bg-slate-300/80 dark:bg-stone-700/80" />
        <div className="flex items-center gap-2 sm:gap-3">
          <GameHandle className="text-xl sm:text-2xl text-amber-600 dark:text-amber-400" />
          <div className="flex flex-col items-start font-title">
            <span className="text-xs text-dim leading-none mb-1">
              {t("playCount")}
            </span>
            <span className="text-lg sm:text-xl font-bold fg-bright leading-none">
              {stats !== undefined ? stats.playCount.toLocaleString() : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
